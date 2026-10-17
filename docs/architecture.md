# How Checkbook works

[Русская версия](architecture.ru.md)

Checkbook is a static progressive web app. Everything that matters happens on the phone: recognising receipts,
computing totals, queueing changes. GitHub only stores files; an AI provider sees a receipt only when someone taps
"Refine with AI" and only through a gateway the family hosts itself.

## Pieces

| Piece | Where it runs | What it does |
|---|---|---|
| App (PWA) | the phone's browser, installed to the home screen | UI, recognition, totals, offline cache and outbox |
| Static hosting | GitHub Pages | serves the built app; it never sees family data |
| Data repository | a private GitHub repository owned by the family | JSON files for operations, categories and payees; receipt files |
| AI gateway (optional) | a small container on the family's own server | checks that the caller can open the data repository, then calls the AI provider with a server-side key |

## Data

One operation is one JSON file; one receipt is one file named by the hash of its content. Two people almost never
edit the same file, and uploading the same receipt twice stores it once.

```
meta/workspace.json           base currency, members, schema version
meta/categories.json          the category tree: id -> node
payees/<payeeId>.json         a payee: name, tax id, aliases, default category
tx/2026/10/<ULID>.json        an operation; the folder is the ULID's creation month and never changes
files/ab/<sha256>.pdf         the original receipt file; "ab" = first two characters of the hash
README.md                     how to read the data without the app
```

Money is stored as integer kopecks; dates as local time plus an IANA time zone.

## Access without accounts

There are no logins or passwords. A device is "signed in" when it holds a GitHub fine-grained token that can open the
data repository (Contents: read and write, Metadata: read). The account owner creates the token in the setup wizard.
A family member receives an encrypted invite as a QR code (`checkbook:1:<base64>`, AES-GCM) plus a 12-digit code said
out loud, so a photo of the QR alone is useless. Every device has its own token, which the owner can revoke at any time.

The token lives only in IndexedDB on the device: never in URLs, logs, error messages or exports. An optional app lock
(Face ID or fingerprint through WebAuthn, or a PIN) protects the interface from bystanders.

## Sync

- **Write.** Changes go through the Git Data API: one commit per batch of up to 20 operations, receipt files as
  separate blobs. The branch only moves forward; on a race the app rebases its batch and retries.
- **Read.** The app polls the branch head with an ETag, so an unchanged repository costs no rate limit. Requests use
  `cache: 'no-store'` so the browser never serves a stale head.
- **Offline.** Everything is cached in IndexedDB. New and edited operations wait in an outbox and are sent in creation
  order as soon as the network is back. Creating and then deleting an operation before it is sent cancels out.
- **Conflicts.** Separate files per operation make real conflicts rare; when two people edit the same operation, the
  app shows both versions and lets the person choose.

## Recognition

Free and exact sources first, AI last:

1. **Fiscal QR code** (camera or image): date, time, amount and fiscal identifiers.
2. **PDF text layer**: templates for transfer and payment receipts of popular banks.
3. **OCR** (Tesseract.js) for photos and screenshots, with a confidence mark on every field.
4. **AI (optional, on tap)** through the gateway. Every value must come with a verbatim quote from the document, and
   the app checks it against the QR amount and the template rules before suggesting it.

Heavy work runs in workers (pdf.js, Tesseract.js, zxing-wasm), so the interface stays responsive on older iPhones.

## Updates and offline start

A service worker caches the app shell. When a new version is published, the app shows "a new version is available"
and switches on the next start or by a tap; data written by a newer version is never opened by an older one. The first
start after installation needs the network; after the "ready to work offline" notice the app opens without it.

## Security notes

- No AI keys anywhere except the gateway's environment; no secrets in the repository or the build.
- A strict Content Security Policy: `connect-src` allows only the app itself, `api.github.com` and the configured gateway.
- No `innerHTML`, no `eval`; user text is always rendered as text.
- CI scans every commit for secrets (gitleaks) and runs unit and end-to-end tests on Chromium and iPhone WebKit.
