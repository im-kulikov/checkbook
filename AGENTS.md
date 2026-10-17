# Checkbook — maintenance notes for coding agents

Checkbook («Чекбук») is a family expense tracker built around receipts. It is a PWA (Vite 8 + TypeScript 6 + Preact 10)
that is installed to the home screen on iPhone and Android and works offline. Family data is stored as JSON files in a
private GitHub repository that the user chooses; the app writes there directly from the browser through the GitHub REST
API, with an outbox queue in IndexedDB. Receipts are recognised on the device (fiscal QR codes, PDF text, OCR). An
optional AI step goes only through the self-hosted gateway in `gateway/`, which keeps the AI provider key on the server.

The site is published with GitHub Pages under a custom domain set in the repository's Pages settings, base path `/`.
Never write that domain (or any other real domain or address) into code, tests or documents: in code the app's own
address is `location.origin`; tests use `https://checkbook.example.ru`. The gateway address is injected at build time
as `VITE_GATEWAY_ORIGIN` from the repository secret `CHECKBOOK_GATEWAY_ORIGIN`; when it is empty there is no AI.

## Ground rules

1. **No AI keys** in code, builds, tests or the repository. Only the gateway talks to the AI provider.
2. **No user data in this public repository**: no real receipts, exports or corpora. Tests use `fixtures/` (synthetic)
   and fake tokens `github_pat_TEST_anna` / `_sergey` / `_mama`.
3. **No personal data anywhere in the repository, commits or pull requests**: no people's names, private repository
   names, domains, IP addresses, server details or device owners. Use placeholders (`anna/checkbook-data`,
   `checkbook.example.ru`, `ai.example.ru`).
4. **Never print secrets**: environment variables, `~/.ssh`, tokens, signing keys. In the app the GitHub token lives only
   in IndexedDB on the device, never in URLs, logs, errors or exports.
5. **Policy files are maintainer-owned** (`.github/CODEOWNERS`): `.claude/`, `.githooks/`, `.github/`,
   `.gitleaks.toml`. Do not edit them; a check that must fail in CI belongs in a vitest test or in a script that
   `ci.yml` already runs.
6. **Dependencies**: only the ones a task names, exact versions (`npm i --save-exact`).
7. Documentation is bilingual: `NAME.md` is English, `NAME.ru.md` is Russian. Change both together.

## Layout

| Path | What |
| --- | --- |
| `src/` | the app: `core/` pure logic without DOM or network (coverage ≥ 90 %), `storage/` the only module that knows GitHub, `recognize/` recognition (`parse/` pure parsers), `ui/components/`, `ui/screens/`, `crypto/`, `export/`, `pwa/` |
| `public/` | static files: manifest, icons, splash screens |
| `design/` | tokens, `ck-*` component CSS, component READMEs, screen mock-ups, icons and illustrations (`design/README.md`) |
| `gateway/` | the optional AI gateway (Node 24, no dependencies) with tests and a Docker Compose example |
| `fixtures/` | synthetic QR codes, photos, PDFs and broken files; every file is described in `fixtures/README.md` |
| `tests/` | unit and e2e tests; `tests/device-checklists/` holds manual checks on real phones |
| `scripts/` | build helpers: `svg-to-tsx.mjs` (illustrations to TSX), `check-assets.mjs`, `check-gateway.sh` |

## Commands (repository root)

```sh
npm ci --ignore-scripts                    # install
npm run typecheck                          # tsc for the app and, separately, sw.ts
npm run lint                               # eslint + prettier --check   (npm run format fixes it)
npm test                                   # vitest; CI: npm test -- --coverage
npx vitest related src/storage/sync.ts --run   # only what a change touches; npx vitest run -t "S23" for one case
npm run illustrations                      # design/assets/illustrations/*.svg -> src/ui/illustrations/*.tsx
npm run build                              # copy-vendor -> illustrations -> typecheck -> vite build -> dist/404.html
npm run build:e2e                          # same with VITE_E2E=1 into dist-e2e/: ?standalone=1 and window.__test (never in prod)
npm run test:e2e                           # Playwright: chromium + iphone-webkit; runs build:e2e itself
node --test gateway/test                   # gateway tests, Node 24
node scripts/check-assets.mjs dist         # icons, splash screens, frozen manifest fields
```

If Playwright browsers cannot be installed in your environment, rely on the e2e job in CI and say so in the PR.

## Code style

- TypeScript strict, ES modules, Preact function components; state in `@preact/signals` (`src/state.ts`).
- Prettier: no semicolons, single quotes, width 120. ESLint forbids `innerHTML`, `dangerouslySetInnerHTML`, `eval`.
- Money is integer kopecks. Operation dates are local time plus an IANA time zone.
- Use the `ck-*` classes from `design/`; no `style="…"` attributes (CSP), dynamic values via `style={{…}}`; sizes in `rem`.
- Comments explain only "why". Test names start with the test-case ID: `test('S23 offline — on a failed request')`.
- UI text is Russian (the product locale) and comes from the product specification, not from guesses.

## Pull requests

- Every change goes through a pull request into `main`; the `test` (ci) and `policy` (commit-policy) checks must pass.
- Conventional Commits in English (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), imperative, subject ≤ 72 characters.
- Commits are signed by the maintainer key; the git hooks in `.githooks/` and the `policy` check enforce it.
- PR descriptions in English: what changed, how to check it on a phone, assumptions.
