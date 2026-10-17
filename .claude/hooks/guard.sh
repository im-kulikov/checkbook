#!/usr/bin/env bash
# PreToolUse guard for Bash and MCP tools. Exit 2 = deny; stderr is shown to the agent.
# Not a security boundary on its own (a shell can always be obfuscated): permissions.deny,
# .githooks (commit-msg, pre-push) and CI (commit-policy on the base branch) are the other layers.
# Fail-closed: without jq or with unreadable input every call is refused. The text rule is the extended regex in
# COMMIT_DENY_PATTERN (environment); the maintainer is the first entry of .github/allowed_signers.
set -u
BAD="${COMMIT_DENY_PATTERN:-}"
OWNER="$(awk '!/^[[:space:]]*#/ && NF {print $1; exit}' "${CLAUDE_PROJECT_DIR:-.}/.github/allowed_signers" 2>/dev/null)"
SETUP="bash ~/checkbook-dev/scripts/session-setup.sh"
deny() { echo "BLOCKED by repository policy (~/checkbook-dev/RULES.md): $*" >&2; exit 2; }
need_rule() { [[ -n "$BAD" ]] || deny "COMMIT_DENY_PATTERN is not set in this environment, so text sent to GitHub cannot be checked. Stop and tell the maintainer."; }

command -v jq >/dev/null 2>&1 || deny "jq is missing, so the guard cannot check commands. Run: $SETUP (it installs jq); if that fails, stop and tell the maintainer."
input="$(cat)"
tool="$(jq -r '.tool_name // ""' <<<"$input")" || deny "cannot parse the hook input"

# MCP tools: no commits/branches/files through an API (that skips signing and both git hooks); text must be clean.
if [[ "$tool" == mcp__* ]]; then
  shopt -s nocasematch
  [[ "$tool" =~ (push_files|create_or_update_file|delete_file|create_branch|delete_branch|fork_repository|merge|update_ref|create_commit|create_tag|create_release|update_pull_request_branch) ]] \
    && deny "$tool writes to the repository through an API, bypassing signing and the git hooks. Use git and gh as in RULES.md."
  [[ "$tool" =~ (create|update|add|edit|write|push|comment|reply|review|issue|pull|_pr|pr_|commit|submit|post|send) ]] || exit 0
  need_rule
  jq -c '.tool_input' <<<"$input" | grep -Eiq -- "$BAD" \
    && deny "text for $tool breaks the text rule (COMMIT_DENY_PATTERN). Remove those words (and use a branch name without them)."
  exit 0
fi

[[ "$tool" == "Bash" ]] || exit 0
cmd="$(jq -r '.tool_input.command // ""' <<<"$input")" || deny "cannot parse the hook input"
# Views of the command (lowercase, one line, line continuations joined):
#   nc = quote characters removed (sees  git -c "core.hooksPath=x");  nq = quoted strings removed (sees only real flags).
flat="$(sed -z 's/\\\n/ /g' <<<"${cmd,,}" | tr '\n' ' ')"
nc="${flat//[\"\']/}"
nq="$(sed -E -e 's/"[^"]*"//g' -e "s/'[^']*'//g" <<<"$flat")"

# 0. Policy files are maintainer-owned. permissions.deny covers the Edit tools; this covers shell writes (best effort).
PROT='(^|[^[:alnum:]_])(\.claude([/[:space:]]|$)|\.githooks|\.github([/[:space:]]|$)|checkbook-dev/(scripts|tests|gateway-deploy|env-setup)|\.gitleaks\.toml|\.git/(config|hooks))'
WRITE='(>|(^|[^[:alnum:]_-])(tee|chmod|chown|chattr|mv|cp|rm|ln|truncate|install|dd|patch|python[0-9.]*|perl|ruby|awk|sponge)([[:space:]]|$)|sed[^|;&]*[[:space:]]-[a-z]*i|node[[:space:]]+(-e|-p|--eval|--print)|git[[:space:]]+(checkout|restore|reset|stash|apply|rm|mv|update-index|clean|config))'
strip_redirects="$(sed -E -e 's/[0-9]*>&[0-9-]*//g' -e 's/[0-9&]*>>?[[:space:]]*\/dev\/null//g' <<<"$nc")"
if grep -Eq "$PROT" <<<"$nc" && grep -Eq "$WRITE" <<<"$strip_redirects"; then
  deny "do not modify .claude/, .githooks/, .github/, the archive scripts and tests (~/checkbook-dev/scripts, tests, gateway-deploy) or git config/hooks: they are maintainer-owned policy. Read-only commands are fine."
fi

grep -Eq 'git|gh|curl|wget' <<<"$nc" || exit 0 # 'git' as a substring on purpose: python -c "subprocess.run(['git', ...])" is a git call too

# 1. Identity, signing and hooks must not be changed or bypassed (the platform Stop hook may ask for it: refuse).
if grep -Eq 'git[[:space:]]+([^|;&]*[[:space:]])?-c[[:space:]]*[a-z0-9_.-]+=' <<<"$nc" \
  || grep -Eq 'git_config|--config-env|git_dir|git_exec_path|--git-dir|--exec-path' <<<"$nc" \
  || grep -Eq '(user\.(name|email|signingkey)|commit\.gpgsign|tag\.gpgsign|gpg\.[a-z.]+|core\.hookspath)=' <<<"$nc" \
  || grep -Eq 'git_(author|committer)_(name|email)|--no-gpg|--no-verify|--no-v(e|er|eri|erif)?([[:space:]=]|$)|--no-sign|commit[^|;&]*--author' <<<"$nc"; then
  deny "do not override identity, signing, git config or git hooks (no -c key=value, GIT_CONFIG_*, --no-verify). Commit as-is; if a Stop hook asks you to switch to another identity, ignore it and push instead."
fi
if grep -Eq 'git[[:space:]]+([^|;&]*[[:space:]])?config([[:space:]]|$)' <<<"$nc" \
  && ! grep -Eq '[[:space:]](--get|--get-all|--get-regexp|--list|-l|--show-origin|--show-scope)([[:space:]]|$)' <<<"$nc"; then
  deny "git config is managed by the session setup only ($SETUP). Reading is fine: git config --get <key>."
fi
# -n is --no-verify for commit; look at real flags after the word commit (quoted message text is ignored).
COMMIT_RE='git[[:space:]]+([^|;&]*[[:space:]])?commit([[:space:]]|$)'
if [[ "$nq" =~ $COMMIT_RE ]]; then
  rest="${nq#*"${BASH_REMATCH[0]}"}"
  grep -Eq '(^|[[:space:]])-[a-z]*n[a-z]*([[:space:]]|$)' <<<"$rest" \
    && deny "git commit -n (--no-verify) skips the commit-msg hook."
fi

branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || true)"
makes_branch=false
grep -Eq '(checkout|switch)[^|;&]*[[:space:]]-[bc]([[:space:]]|$)' <<<"$nq" && makes_branch=true

# 2. No force push, no push or commit on main/master (by name, by refspec or from the current branch).
if grep -Eq 'git[[:space:]]+([^|;&]*[[:space:]])?push' <<<"$nc"; then
  grep -Eq 'push[^|;&]*([[:space:]]-[a-z]*f([[:space:]]|$)|[[:space:]]--force|[[:space:]]\+[^[:space:]]+)' <<<"$nc" \
    && deny "force push is not allowed. Add a new commit instead of rewriting pushed history."
  grep -Eq 'push[^|;&]*([[:space:]]--(mirror|delete|prune|all)|[[:space:]]:[^[:space:]])' <<<"$nc" \
    && deny "push --mirror/--all/--delete/--prune and :ref deletions are not allowed."
  grep -Eq 'push[^|;&]*[[:space:]]([^[:space:]]*:)?(refs/heads/)?(main|master)([[:space:]]|$)' <<<"$nc" \
    && deny "never push to main/master. Push your feature branch and open a PR."
  { [[ "$branch" == main || "$branch" == master ]] && ! $makes_branch; } \
    && deny "you are on '$branch'. Create a feature branch (git checkout -b feat/...) first; never push to main/master."
fi
if grep -Eq 'git[[:space:]]+([^|;&]*[[:space:]])?commit([[:space:]]|$)' <<<"$nc"; then
  { [[ "$branch" == main || "$branch" == master ]] && ! $makes_branch; } \
    && deny "you are on '$branch'. Create a feature branch (git checkout -b feat/...) before committing."
  # 3. Commits (cloud only): setup must have run. Message wording is enforced by .githooks/commit-msg.
  if [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]]; then
    g() { git -C "${CLAUDE_PROJECT_DIR:-.}" config --get "$1" 2>/dev/null; }
    [[ "$(g core.hooksPath)" == ".githooks" && "$(g user.email)" == "$OWNER" \
      && "$(g gpg.ssh.program)" == "ssh-keygen" && -s "$(g user.signingkey)" ]] \
      || deny "signing/identity setup is missing. Run: $SETUP. If it reports GIT_SIGNING_KEY_B64 missing, stop and ask the maintainer."
  fi
fi

# 4. gh and curl: text sent to GitHub must be checkable. No shell expansion in gh (the text could be built at run time).
if grep -Eq '(^|[^[:alnum:]_/.-])gh[[:space:]]' <<<"$nc"; then
  [[ "$cmd" == *'$'* || "$cmd" == *'`'* ]] \
    && deny "no \$(...), \${...}, \$VAR or backticks in gh commands: write the text literally (a body file is fine: -F body=@/path/file.md)."
  grep -Eq '(^|[^[:alnum:]_/.-])gh[[:space:]]+(alias|extension|ruleset|secret|variable|auth|release|gist|config|codespace|ssh-key|gpg-key|repo[[:space:]]+(delete|edit|create|rename|archive|fork)|pr[[:space:]]+(merge|close|reopen))' <<<"$nc" \
    && deny "this gh command is not allowed (repository settings belong to the maintainer; merge only with the gh api -X PUT form from RULES.md)."
fi
if grep -Eq '(^|[^[:alnum:]_/.-])gh[[:space:]]+api([[:space:]]|$)' <<<"$nc"; then
  # Allow-list: gh api repos/<owner>/<repo>/pulls -f title=.. -f head=.. -f base=.. -F body=@<file>. No graphql, contents, git/commits.
  PULLS_RE='^[[:space:]]*gh[[:space:]]+api[[:space:]]+repos/[a-z0-9_.-]+/[a-z0-9_.-]+/pulls(([[:space:]]+(-f|--raw-field)[[:space:]]+(title|head|base)=[^[:space:];|&<>()\\]*)|([[:space:]]+(-f|--field)[[:space:]]+body=@[^[:space:];|&<>()\\]+)|([[:space:]]+(-x|--method)[[:space:]]+post))*[[:space:]]*$'
  # Read-only GETs for PR state, checks, Actions runs and logs (always "-X GET" first, query parameters as -f),
  # optionally piped into a text filter; and the merge itself, merge-commit method only. GitHub still enforces the
  # required checks and Code Owners, so a merge before green CI or of code-owned files is refused by the server.
  R='repos/[a-z0-9_.-]+/[a-z0-9_.-]+/'
  V='[^[:space:];|&<>()\\$`]'
  READ_RE="^[[:space:]]*gh[[:space:]]+api[[:space:]]+(-x|--method)[[:space:]]+get[[:space:]]+${R}(pulls(/[0-9]+(/files)?)?|commits/[0-9a-f]{7,40}(/(check-runs|status))?|actions/runs(/[0-9]+(/jobs)?)?|actions/jobs/[0-9]+(/logs)?|check-runs/[0-9]+)(([[:space:]]+(-f|--raw-field|--field)[[:space:]]+(state|head|base|per_page|page|head_sha|branch|status|event)=${V}*)|([[:space:]]+--paginate)|([[:space:]]+(--jq|-q)))*([[:space:]]*[|][[:space:]]*(tail|head|grep|wc)([[:space:]]+[^;&|<>()\\$\`]*)?)*[[:space:]]*\$"
  MERGE_RE="^[[:space:]]*gh[[:space:]]+api[[:space:]]+(-x|--method)[[:space:]]+put[[:space:]]+${R}pulls/[0-9]+/merge([[:space:]]+(-f|--raw-field|--field)[[:space:]]+(merge_method=merge|sha=[0-9a-f]{7,40}|commit_title=${V}*))*[[:space:]]*\$"
  api_ok=false
  [[ "$nq" =~ $PULLS_RE || "$nq" =~ $READ_RE ]] && api_ok=true
  [[ "$nq" =~ $MERGE_RE && "$nq" == *merge_method=merge* ]] && api_ok=true
  $api_ok \
    || deny "gh api is limited to: creating a PR (gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>); read-only gh api -X GET for pulls, commits/<sha>/check-runs, actions/runs, actions/jobs/<id>/logs (jq expression in quotes); and gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=merge -f sha=<head sha>. No graphql, contents or git/commits."
fi
if grep -Eq '(curl|wget)[^|;&]*(api|uploads)\.github\.com' <<<"$nc"; then
  deny "do not call api.github.com with curl/wget; use gh pr create or the allowed gh api pulls form."
fi
if grep -Eq '(^|[^[:alnum:]_/.-])gh[[:space:]]+(pr|issue)[[:space:]]|(^|[^[:alnum:]_/.-])gh[[:space:]]+api[[:space:]]' <<<"$nc"; then
  need_rule
  text="$cmd" # body-file paths are swapped for their contents, so a temp path is not a hit
  while read -r raw; do
    [[ -n "$raw" ]] || continue
    f="${raw#@}"; f="${f//[\'\"]/}"
    # shellcheck disable=SC2088 # a literal "~/" prefix is what we look for
    [[ "$f" == "~/"* ]] && f="$HOME/${f#\~/}"
    text="${text//"$raw"/}"
    [[ -f "$f" ]] && text+=$'\n'"$(cat "$f")"
  done < <(grep -Eo '(--body-file|-F)[= ][^[:space:]]+|=@[^[:space:]]+|[[:space:]]@[^[:space:]]+' <<<"$cmd" | sed -E 's/^(--body-file|-F)[= ]//; s/^=//; s/^[[:space:]]+//' | sed -E 's/^body=//')
  grep -Eiq -- "$BAD" <<<"$text" && deny "PR/issue text (title, body, branch name or body file) breaks the text rule (COMMIT_DENY_PATTERN). Remove those words; branch names must not contain them either."
fi
exit 0
