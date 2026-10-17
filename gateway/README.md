# Checkbook AI gateway

[Русская версия](README.ru.md)

An optional, self-hosted helper that lets the Checkbook app ask an AI model to read a hard receipt. The app never holds
an AI key: it sends the document to this gateway, the gateway checks that the caller really belongs to the family and
only then calls the AI provider ([ProxyAPI](https://proxyapi.ru), an OpenAI-compatible API) with its own key.

`server.mjs` is plain `node:http` on Node 24 with no dependencies. The container listens on `127.0.0.1:8080` only, runs
as a non-root user with a read-only filesystem and no capabilities. Put any HTTPS reverse proxy in front of it.
State (key cache, rate-limit windows, circuit breaker) lives in the memory of a single process, so the limits below are exact.

Accepted risk: a family member's GitHub token passes through the gateway (it is used to check access and is never
logged). If a token may have leaked, revoke it and issue a new one.

Files: `server.mjs`, `package.json`, `Dockerfile` (`node:24.22.0-alpine3.24`, pinned by digest), `compose.yaml` (one
service, image `ghcr.io/im-kulikov/checkbook-gateway:${GATEWAY_TAG}`), `.env.example`, `test/`.

## Configuration

| Variable | Required | Meaning |
|---|---|---|
| `PROXYAPI_KEY` | yes | the AI provider key; only in `.env` on the server |
| `GITHUB_REPO` | yes | the private data repository, `owner/name`; only tokens that open exactly this repository get through |
| `ALLOWED_ORIGIN` | yes | the app origin, e.g. `https://checkbook.example.ru`, no trailing `/` |
| `MODEL` | no | default `google/gemini-2.5-flash-lite` |
| `MAX_COMPLETION_TOKENS` | no | default `1500` |
| `PORT` | no | default `8080` |

The gateway refuses to start without the three required variables and names the missing one.

## What it does

| Step | Behaviour |
|---|---|
| `/healthz` | `GET` (and `HEAD`) → 200 `ok` without `Origin` or key (with `Access-Control-Allow-Origin: $ALLOWED_ORIGIN`, so the app can show the state); neither ProxyAPI nor GitHub is called, nothing is logged. Used by the compose healthcheck and `scripts/check-gateway.sh` |
| CORS | `OPTIONS` (answered by the gateway itself; the reverse proxy must not add CORS headers) → 204 with `Access-Control-Allow-Methods: POST, OPTIONS`, `Allow-Headers: content-type, x-checkbook-key`, `Max-Age: 600`. `Origin` ≠ `ALLOWED_ORIGIN` → 403 `origin` |
| Key | header `X-Checkbook-Key` (not `Authorization`, which keeps CORS simple), any case. Missing → 401 `no_key`; not `github_pat_…` → 401 `bad_key_format` (GitHub is not asked) |
| Key check | `GET https://api.github.com/repos/$GITHUB_REPO` with that key: 200, `private: true`, exact name. Otherwise 401 `bad_key` / 403 `no_access` / 403 `repo_not_private`. Cache by SHA-256 of the key: success **2 min** (a revoked token stops working within that time), failure 1 min; on overflow (1000 entries) the oldest are evicted. GitHub limit or outage → 503 `github_unavailable` (not cached) |
| Limits | **10 requests per minute per key** (sliding 60 s window; the 11th → 429 `rate_limited`, ProxyAPI is not called; requests with a bad body count too). **20 new keys per minute** for the whole gateway (beyond that → 429 `rate_limited`, GitHub is not called). **Circuit breaker:** 5 ProxyAPI 4xx answers within 60 s (retries after 429 count too) → for 60 s every request gets 429 `ai_paused` and ProxyAPI is not called, so a broken client or a stolen token cannot get the shared ProxyAPI key paused for hours (20 4xx answers per minute) |
| Body | only `{"task":"extract_receipt","text"?,"image"?}`; other fields are ignored. `text` ≤ 20 000 characters, `image` is `data:image/jpeg|png;base64,…`, 1 KB ≤ size ≤ 2 MB after decoding (inclusive), first bytes are the JPEG `FF D8 FF` or PNG `89 50 4E 47` magic → otherwise 413 `too_large` / 400 `bad_json` `bad_task` `empty` `bad_text` `bad_image`. Let the reverse proxy reject bodies over 4 MB |
| ProxyAPI | `POST https://api.proxyapi.ru/v1/chat/completions`, `Authorization: Bearer $PROXYAPI_KEY`, `model=$MODEL`, `max_completion_tokens=$MAX_COMPLETION_TOKENS`, `response_format: json_object`, a system prompt with the result contract (every value with an `ev` quote from the document) |
| Retries | 429 → after 1 and 2 s (up to 2 retries, counted as 4xx) → 429 `ai_busy`; 5xx or a network error → 1 retry → 502 `ai_unavailable`; 402 → 402 `ai_limit`; other 4xx are never retried → 502 `ai_rejected`; 30 s per attempt, 55 s in total → 504 `ai_timeout` |
| Response | 200 `{"result": {...}}` — the model's JSON. The app checks it against the contract, the `ev` quotes and the QR amount |
| Log | one line per request on stdout: `{"keyId":"<8 hex of sha256>","status":200,"ms":2140}`. Keys, headers, bodies and ProxyAPI answers are never written. Rotation: json-file, 3 × 10 MB |

## What the app does (not the gateway)

The client code is `src/recognize/ai.ts` with unit tests that mock `fetch`.

- Before sending, a photo is scaled to ≤ 1600 px on the long side, JPEG quality ≈ 0.8, target < 1 MB, EXIF removed. PDF
  text is cut to 20 000 characters. If it is still over 2 MB, nothing is sent and the app says «Файл слишком большой для ИИ».
- At most 10 requests per minute from one device (sliding window): the 11th is not sent, the user sees «Слишком много
  запросов к ИИ, подождите минуту» (no queue). It is the same limit as the gateway's per key.
- 429 `rate_limited` and 429 `ai_paused` are not retried (for `ai_paused`: «ИИ временно приостановлен, попробуйте через минуту»).
- 4xx from the gateway are never retried; 502/504 and network errors get one retry after 2 s.
- After 402 `ai_limit` the «Уточнить с ИИ» button stays off until restart: the account owner sees «Лимит ИИ исчерпан —
  пополните баланс ProxyAPI», other members «Лимит ИИ исчерпан — скажите владельцу».
- Client timeout 60 s (`AbortSignal.timeout(60_000)`); the gateway finishes within 55 s.
- The member's key goes only in `X-Checkbook-Key`; the body is only `{task, text?, image?}`.
- The gateway address is not typed in: it comes from `import.meta.env.VITE_GATEWAY_ORIGIN` at build time. Empty means no
  AI buttons. The AI settings screen shows the address and the state (`GET /healthz`).

## Tests

```sh
node --test gateway/test    # Node 24, no npm install; the gateway runs on a random port, GitHub and ProxyAPI are faked, nothing leaves the machine
```

## Running it

1. Copy `compose.yaml` and `.env.example` to the server, `cp .env.example .env && chmod 600 .env`, fill in the values.
2. Start a published image: `GATEWAY_TAG=<commit sha> docker compose up -d`.
3. Put an HTTPS reverse proxy in front of `127.0.0.1:8080`: forward requests as they are, do not add CORS headers,
   limit the body to 4 MB, keep upstream connections idle for less than 130 s.
4. Check it from outside: `ALLOWED_ORIGIN=https://checkbook.example.ru bash scripts/check-gateway.sh https://ai.example.ru`.
5. Build the app with the repository secret `CHECKBOOK_GATEWAY_ORIGIN` = the gateway's public origin (no trailing `/`).

The workflow `.github/workflows/gateway.yml` runs the tests, publishes the image to GHCR (tag = commit sha; the package
is public, there are no secrets inside) and, if the environment `vps` has the secrets `VPS_HOST`, `VPS_PORT`, `VPS_USER`,
`VPS_SSH_KEY` and `VPS_KNOWN_HOSTS`, connects over SSH with strict host-key checking and sends only the commit sha. The
server side decides what to do with it, typically a forced command in `authorized_keys` that validates the sha, pulls
the image, restarts the service and rolls back if `/healthz` does not answer. Without those secrets the deploy job is skipped.
