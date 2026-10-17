#!/usr/bin/env bash
# Checks a deployed AI gateway: ALLOWED_ORIGIN=https://checkbook.example.ru bash scripts/check-gateway.sh https://ai.example.ru[:8443]
# No keys are needed or used: health, CORS and refusals without a key are checked. ProxyAPI is never called.
set -u
URL="${1:-}"
APP_ORIGIN="${ALLOWED_ORIGIN:-}"
[[ "$URL" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ && "$APP_ORIGIN" =~ ^https://[A-Za-z0-9.-]+$ ]] || { echo "usage: ALLOWED_ORIGIN=https://checkbook.example.ru $0 https://ai.example.ru[:8443]  (both origins without a path or trailing "/")" >&2; exit 2; }
fails=0
check() { # check <description> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1: expected '$2', got '$3'"; fails=$((fails + 1)); fi
}
curl_() { curl -sS --max-time 15 "$@"; }

check "GET /healthz -> ok 200 (HTTPS certificate accepted)" "ok 200" "$(curl_ -w ' %{http_code}' "$URL/healthz")"

pre="$(curl_ -i -X OPTIONS "$URL/" -H "Origin: $APP_ORIGIN" -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,x-checkbook-key' | tr -d '\r')"
check "OPTIONS with the app Origin -> 204" "204" "$(printf '%s\n' "$pre" | awk 'NR==1{print $2}')"
check "exactly one Access-Control-Allow-Origin: $APP_ORIGIN" "access-control-allow-origin: $APP_ORIGIN" \
  "$(printf '%s\n' "$pre" | grep -i '^access-control-allow-origin:' | tr '[:upper:]' '[:lower:]' | paste -sd'|' -)"
check "Allow-Headers contains x-checkbook-key" "1" "$(printf '%s\n' "$pre" | grep -ic '^access-control-allow-headers:.*x-checkbook-key')"

check "POST with a foreign Origin -> 403" "403" "$(curl_ -o /dev/null -w '%{http_code}' -X POST "$URL/" -H 'Origin: https://evil.example' -d '{}')"
check "POST without a key -> 401" "401" "$(curl_ -o /dev/null -w '%{http_code}' -X POST "$URL/" -H "Origin: $APP_ORIGIN" -d '{}')"
check "POST with a malformed key -> 401" "401" \
  "$(curl_ -o /dev/null -w '%{http_code}' -X POST "$URL/" -H "Origin: $APP_ORIGIN" -H 'X-Checkbook-Key: not-a-token' -d '{}')"

if [ "$fails" -eq 0 ]; then echo "Gateway $URL works."; else echo "Failed checks: $fails" >&2; exit 1; fi
