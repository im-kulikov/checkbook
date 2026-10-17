# fixtures/ — synthetic files for tests

English · [Русский](README.ru.md)

All data is fictional; there are no logos or real brands. One example is used everywhere: the company ООО «Стройдвор» (Stroydvor LLC), INN 7700000009
(synthetic, valid checksum), 12,500.00 RUB, 15.10.2026 14:30, FN 7380440700076549, FD 41250, FP 2829170618,
bank «Тестовый банк „Пример“» (Test Bank "Example"), sender «Анна А.». The bank fixtures (`pdf/tbank-*`, `pdf/sber-*`) feature the fictional Anna Viktorovna Petrova and Sergei Nikolaevich Petrov, the shop «Стройдвор», 12,500.00 RUB, 14.10.2026; the bank name in them is plain text, there are no logos. Real receipts and genuine bank PDFs never end up in git: for calibration they are kept locally in `fixtures/private/` (the folder is in `.gitignore`).

Test-case IDs: R — recognition, E — entry, S — sync, A — security.

| File | What is inside | Test cases | Where it is already used | Source |
|---|---|---|---|---|
| `qr/R01.txt`, `qr/R01.png` | FNS (Russian tax service) QR, `t=20261015T143005` (with seconds) | R01 | `tests/unit/fnsQr.test.ts` | in git |
| `qr/R02.txt`, `qr/R02.png` | FNS QR, `t=20261015T1430` (no seconds), `s=12500.00`, `n=1` | R02, R35, I09, S22 | fnsQr.test.ts, `tests/e2e/hosts.spec.ts` (zxing in the browser) | in git |
| `qr/R03.txt`, `qr/R03.png` | the same fields in a different order with the prefix `https://check.example.test/rec?` | R03 | fnsQr.test.ts | in git |
| `qr/R04.txt`, `qr/R04.png` | `s=1500` without kopecks → 150,000 kopecks | R04 | fnsQr.test.ts | in git |
| `qr/R05.txt`, `qr/R05.png` | `n=2` — return of income (refund) | R05 | fnsQr.test.ts | in git |
| `photo/receipt-qr.jpg` | a "photo" of a till receipt on a table: 4° rotation, noise, uneven light, QR = R02; items 8,000 + 4,500 = TOTAL («ИТОГ») 12,500, with a «СУММА НДС» (VAT amount) line below | R02 on a photo, R11 (do not take VAT), R20 (together with the receipt from `pdf/`), metric "QR recognised on a photo", NFR-F3, R35 | — | in git |
| `photo/receipt-qr-rotated-blurred.jpg` | the same receipt: 17° rotation, blur, heavy noise, JPEG 70 | R27, metric "QR recognised on a photo" | — | in git |
| `photo/exif-gps.jpg` | a downscaled photo of a receipt with EXIF: `DateTimeOriginal 2026:10:15 14:31:12`, `OffsetTimeOriginal +03:00`, GPS 55.7558 N, 37.6175 E (central Moscow, fictional shot), Make `TestCam` | A12, NFR-P2 (EXIF and GPS removed before saving and before anything is sent to AI), R26 (date from EXIF as a fallback source), R29 (EXIF removed after compression), I33 (unit) | — | in git |
| `pdf/bank-sbp-pending.pdf` | an SBP (Russian instant payments) transfer receipt with a text layer, status **«В обработке»** ("Processing"), SBP operation ID `A6288113000000000000000000000001` | R18 (draft in the Inbox), E07 and S17 (the same file twice → one file, hard duplicate) | hosts.spec.ts (share target) | in git |
| `pdf/bank-sbp-done.pdf` | the same operation, status **«Исполнен»** ("Completed"), the same SBP ID | R18 (confirms the draft by SBP ID, FR-2.7 item 2), R20, R35, X04, I10 | hosts.spec.ts (pdf.js text: «Статус Исполнен», «Сумма 12 500,00 ₽») | in git |
| `pdf/scan-no-text.pdf` | the same receipt as an image, without a text layer | R23 (fall back to OCR), R22, R35 | — | in git |
| `pdf/oversize-6mb.pdf` | a valid 6.2 MB PDF (noise) | R32 / NFR-D1 (5 MB PDF limit) | — | in git |
| `bad/empty.pdf` | 0 bytes | R31 | — | in git |
| `bad/svg-renamed.jpg` | an SVG with a .jpg extension | R30 (reject by signature) | — | in git |
| `bad/html-renamed.pdf` | HTML with a .pdf extension | R30 | — | in git |
| `frozen.json` | frozen manifest fields (`id`, `start_url`, `scope`, `display`, `name`, `short_name`, `apple-mobile-web-app-title`) and the SHA-256 of `apple-touch-icon.png`, `pwa-192.png`, `pwa-512.png`, `maskable-512.png` | I19 | — | in git |
| `github/empty-409.json` | state of a fake repository with no commits: the Git Data API answers 409, the first write goes through `PUT /contents/meta/workspace.json` (FR-8.57) | A02 | — | in git |
| `github/force-push-empty-tree.json` | the branch was overwritten with an empty tree (force-push), the phone cache holds 12 operations | S13 | — | in git |
| `github/workspace-expiring.json` | `meta/workspace.json`, Sergei's `tokenExpiresAt` = `2026-10-25` | A05 | — | in git |
| `github/workspace-min-version.json` | `meta/workspace.json` with `"minAppVersion": "1.1.0"`; the second variant has `minAppVersion` `1.0.0` and `"schemaVersion": 2` | UP07 | — | in git |
| `github/op-v2.json` | an operation `tx/2026/10/<ULID>.json` with `"v": 2`, next to a `workspace.json` with `"schemaVersion": 2` | UP08 | — | in git |
| `github/op-unknown-field.json` | an operation with `"v": 1` and an unknown field `"warrantyUntil": "2028-03-01"` | S15 | — | in git |
| `github/gen-ops.mjs` | generator for the fake GitHub: 5,000 operations spread over months (only the script is in git, the data is built in memory) | S14 | — | in git |
| `qr/invite.txt`, `qr/invite.png` | `checkbook:1:<base64>`, encrypted with the code `123456789012`, containing `github_pat_TEST_mama` and `expiresAt`; for printing and scanning with a phone | G01, G03, G30, I31, V02 | — | in git |
| `pdf/ofd-3-pages.pdf` | text layer, three receipts on three pages: (1) «Получено 2 000,00 / Сдача 250,00 / ИТОГ 1 750,00» (received / change / total), (2) «ПОДИТОГ 2 000,00 / Скидка 200,00 / ИТОГ 1 800,00» (subtotal / discount / total), (3) «Стройдвор», ИТОГ 12 500,00 and below it «СУММА НДС 2 083,33» | R07, R10, R11, R12 | — | in git |
| `pdf/bank-sbp-transfer.pdf` | an SBP transfer receipt with a text layer: recipient «Иван Иванович И.», `+7 *** ***-12-34`, bank «Тестовый банк „Пример“», sender «Анна А.», card `**** 1234`, 10,000.00 RUB + 30.00 RUB fee | R17, R19, R21, AI02 | — | in git |
| `pdf/ofd-correction.pdf` | a correction receipt (the «Чек коррекции» attribute) | R13 | — | in git |
| `pdf/bank-statement.pdf` | a bank statement: heading «Выписка» (Statement), 5 operation lines | R28 | — | in git |
| `pdf/tbank-sbp-done.pdf` | T-Bank, SBP transfer, «Успешно» (Successful), no fee, value to the right of the label; recipient «Сергей Николаевич П.», `+7 *** ***-12-34`, 12,500.00 RUB, 14.10.2026 14:05:33; the text layer is shown below | R36, R39, R41, R43 (source of the scan), R45, R47, R48 | — | in git |
| `pdf/tbank-sbp-done-stacked.pdf` | the same data, label and value on separate lines (the second value layout) | R36 | — | in git |
| `pdf/tbank-sbp-pending.pdf` | the same transfer, status «В обработке» (Processing), no SBP identifier | R38, R39 | — | in git |
| `pdf/tbank-transfer-fee.pdf` | T-Bank, transfer by bank details: 12,500.00 RUB + 187.50 RUB fee, «Итого» (Total) 12,687.50 RUB, recipient «Мария Олеговна К.» | R37 | — | in git |
| `pdf/tbank-card-payment.pdf` | T-Bank, card payment: «Стройдвор», 12,500.00 RUB, 14.10.2026 12:41:07 (the layout is a guess) | R46 | — | in git |
| `pdf/sber-mortgage-payment.pdf` | Sber, «Чек по операции» (Operation receipt), mortgage repayment, «Исполнено» (Completed), `*4321`, 14.10.2026 09:15:42 (Moscow time) | R40, R49 | — | in git |
| `pdf/sber-mortgage-processing.pdf` | the same payment, status «Обрабатывается» (Processing), the same «Номер операции» (operation number) (the pair of `sber-mortgage-payment.pdf`) | R40 | — | in git |
| `pdf/unknown-bank-generic.pdf` | «Банк Пример» (Bank Example), generic labels only: «Дата» (Date), «Сумма» (Amount), «Получатель» (Recipient; «Стройдвор»), 12,500.00 RUB | R42 | — | in git |
| `pdf/tbank-sbp-done-scan.pdf` | a raster copy of `tbank-sbp-done.pdf` without a text layer (rendered to PNG, wrapped in a PDF); the expected OCR text is the lines of `tbank-sbp-done.pdf` | R43 | — | in git |
| `pdf/tbank-statement.pdf` | T-Bank, «Справка о движении средств» (Statement of account movements): one page, a table of two operations; a refusal is expected: "a receipt for a single operation is needed" | R44 | — | in git |
| `manifest.json` | a list of all files in `pdf/` and `photo/` marked `{"synthetic": true}`; CI (test X17) fails if an entry is missing | X17 | — | in git |
| `private/` | **not in git** (`fixtures/private/` is in `.gitignore`): 2–3 genuine bank PDFs for `npm run calibrate:banks`; the maintainer creates the folder locally, it does not exist in CI | R50 (R45 uses a copy of a synthetic fixture via `--dir`) | — | manual |
| `pdf/password-1234.pdf` | a receipt encrypted with the password `1234` | R24 | — | in git |
| `pdf/js-in-font.pdf` | a font with a harmless payload `window.__pwned = 1` (the CVE-2024-4367 class) | A08 | — | in git |
| `qr/three-receipts.png` | three FNS QR codes in one image (amounts 12,500.00, 3,000.00, 1,290.00) | R06 | — | in git |
| `photo/foreign-eur.jpg` | a Finnish receipt: «YHTEENSÄ» (total), EUR, 48.90 | R15, E15 | — | in git |
| `bad/truncated.jpg`, `bad/truncated.pdf` | files cut off in the middle: recognition does not crash, a draft with the file remains (FR-2.2) | X05 | — | in git |
| `big/pdf-25mb.pdf`, `big/batch-21/*.png` | **not in git**, created by `scripts/make-fixtures.mjs`: a valid 25 MB PDF (noise); 21 different PNGs with an FNS QR (different `fp` values, so there are no hard duplicates) for batches of 20 and 21 files and for the three drafts of R33; built in Playwright's and Vitest's `globalSetup`, no separate CI step is needed | R32, R33, X02, X03, I35 | — | generated |
| `device-kit/README.md` | what to put into the iCloud Drive folder «Чекбук тест» and into Photos to test on a phone, and what to print: `pdf/bank-sbp-done.pdf`, `pdf/bank-sbp-pending.pdf`, `pdf/ofd-3-pages.pdf`, `qr/R02.png` (print), `qr/invite.png` (print), `photo/receipt-qr.jpg` | I09, I10, I31, X04 | — | in git |
| `pdf/bank-garbled-tounicode.pdf` | a receipt with a text layer without a ToUnicode table (the text comes out as garbage) | R22 | — | in git |
| `photo/screenshot-dark-cut-date.png` | a dark screenshot of a banking app, the date line is cut off | R25 | — | in git |
| `photo/screenshot-vchera-2350.png` | a screenshot captioned «Вчера, 23:50» (Yesterday, 23:50), no date in the text | R26 | — | in git |
| `photo/stroydvor-no-qr.jpg` | a printed receipt of ООО «Стройдвор», INN 7700000009, «ИТОГО 12 500,00», no QR | S21, S22 | — | in git |
| `pdf/ofd-prepay.pdf`, `pdf/ofd-prepay-final.pdf` | two OFD (fiscal data operator) receipts: «Предоплата 100 %» (100% prepayment) for 12,500.00 and «Полный расчёт» (full settlement) with the advance offset (the `prepay_offset` attribute) | R14 | — | in git |
| `photo/exif-orientation6.jpg` | a portrait JPEG 3024×4032 with EXIF Orientation 6 and GPS: tests orientation handling and EXIF removal without HEIC (unit) | R29, I33 | — | in git |
| `pdf/scan-10-pages.pdf` | 10 scanned pages of a receipt without a text layer (a copy for the phone is in `device-kit/`) | I34 | — | in git |
| `device-kit/heic-portrait-gps.heic` | HEIC 4032×3024 (≈ 4 MB) with GPS: shot by hand on an iPhone from a printed `photo/receipt-qr.jpg` (Settings → Camera → Formats → "High Efficiency"); not kept in git, the steps are described in `device-kit/README.md` | R29, I08, I33 | — | manual |
| `gateway/ok-json-schema.json`, `gateway/402.json`, `gateway/429.json`, `gateway/400.json`, `gateway/403-model.json` | ProxyAPI responses for mocking the gateway's `fetch`: success with the model's JSON, `402 {"detail":"Insufficient balance to run this request."}`, `429`, `400`, `403 {"detail":"Model not allowed"}`; the 404, 422, 502 and 504 responses are built in the tests; the images for G31 (JPEG and PNG ≥ 1 KB, GIF, PDF, HTML, empty) are assembled from bytes by the test | G08, G10, G21, G22, G29, G31 | — | in git |
| `big/photo-5mb-4032x3024.jpg`, `big/body-3_6mb.json` | **not in git**, created by `scripts/make-fixtures.mjs`: a JPEG 4032×3024 ≈ 5.2 MB and a 3.6 MB request body | G20 | — | generated |

The "Source" column: "in git" — the file is in `fixtures/` in the repository; "generated" — not stored in git, the file is built by the script `scripts/make-fixtures.mjs`; "manual" — not stored in git, the file is prepared by hand.
A new file goes here first, as a row (GIT17), then into `fixtures/src/make_fixtures.py` (PDF, photos) or `make-qr.mjs` (QR).
`big/` is not in git: the files are built by `scripts/make-fixtures.mjs`. `device-kit/` is only for testing on a real phone. Never put real receipts here.

## Text layer of the bank PDFs

The labels in these files are assumptions, not copies of real layouts: the fixtures test the **parsing logic**. After calibrating on genuine PDFs the labels are replaced, and the real label is added as a new synthetic fixture. `␣␣` in a line means two separate text items at the same Y coordinate (label and value); pdf.js joins them into one line. The BIC and INN in the footers are plausible values and are not verified. The SBP identifier (32 characters) was chosen arbitrarily. The files are built by `fixtures/src/make_fixtures.py` (reportlab: label and value are two `drawString` calls at the same Y; the scan is a render of `tbank-sbp-done.pdf` to PNG wrapped in a PDF).

**`pdf/tbank-sbp-done.pdf`** — SBP transfer, successful, no fee, value to the right of the label.
```
Т-Банк
Квитанция о переводе
Перевод по номеру телефона
Статус␣␣Успешно
Дата и время операции␣␣14.10.2026 14:05:33
Сумма перевода␣␣12 500,00 ₽
Комиссия␣␣Без комиссии
Получатель␣␣Сергей Николаевич П.
Телефон получателя␣␣+7 *** ***-12-34
Банк получателя␣␣Сбербанк
Счёт списания␣␣*1234
Сообщение получателю␣␣На стройматериалы
Идентификатор операции в СБП␣␣A1234567890123456789012345678901
АО «ТБанк», БИК 044525974, ИНН 7710140679
```

**`pdf/tbank-sbp-done-stacked.pdf`** — the same data, but label and value on separate lines (tests the second layout).
```
Т-Банк
Квитанция о переводе
Статус
Успешно
Дата и время операции
14.10.2026 14:05:33
Сумма перевода
12 500,00 ₽
Комиссия
Без комиссии
Получатель
Сергей Николаевич П.
Телефон получателя
+7 *** ***-12-34
Банк получателя
Сбербанк
Идентификатор операции в СБП
A1234567890123456789012345678901
```

**`pdf/tbank-sbp-pending.pdf`** — the same transfer, status "В обработке" (Processing), no SBP identifier.
```
Т-Банк
Квитанция о переводе
Перевод по номеру телефона
Статус␣␣В обработке
Дата и время операции␣␣14.10.2026 14:05:33
Сумма перевода␣␣12 500,00 ₽
Комиссия␣␣Без комиссии
Получатель␣␣Сергей Николаевич П.
Телефон получателя␣␣+7 *** ***-12-34
Банк получателя␣␣Сбербанк
Счёт списания␣␣*1234
```

**`pdf/tbank-transfer-fee.pdf`** — a transfer by bank details to another person with a fee (tests "fee separately").
```
Т-Банк
Квитанция о переводе
Перевод по реквизитам
Статус␣␣Успешно
Дата и время операции␣␣14.10.2026 15:20:10
Сумма перевода␣␣12 500,00 ₽
Комиссия␣␣187,50 ₽
Итого␣␣12 687,50 ₽
Получатель␣␣Мария Олеговна К.
Банк получателя␣␣Банк Пример
Счёт списания␣␣*1234
Номер квитанции␣␣T-0000000001
АО «ТБанк», БИК 044525974, ИНН 7710140679
```

**`pdf/tbank-card-payment.pdf`** — a card payment in a shop (the layout is a guess; there is no genuine receipt to compare against).
```
Т-Банк
Квитанция об оплате
Статус␣␣Успешно
Дата и время операции␣␣14.10.2026 12:41:07
Сумма платежа␣␣12 500,00 ₽
Комиссия␣␣0,00 ₽
Получатель␣␣Стройдвор
Карта списания␣␣*1234
Номер квитанции␣␣T-0000000002
```

**`pdf/sber-mortgage-payment.pdf`** — Sber, mortgage repayment (a loan payment).
```
СберБанк
Чек по операции
Погашение кредита
Название операции␣␣Погашение кредита
Дата и время операции␣␣14.10.2026 09:15:42 (МСК)
Номер операции␣␣1000000000001
Статус␣␣Исполнено
Сумма операции␣␣12 500,00 ₽
Комиссия␣␣0,00 ₽
Получатель␣␣ПАО Сбербанк
Номер договора␣␣*4321
Счёт списания␣␣*5678
Назначение платежа␣␣Погашение кредита по договору *4321
ПАО Сбербанк, БИК 044525225, ИНН 7707083893
```

**`pdf/sber-mortgage-processing.pdf`** — the same payment, status "Обрабатывается" (Processing) (tests confirmation by a repeated receipt; the pair of `pdf/sber-mortgage-payment.pdf`, with the same "Номер операции").
```
СберБанк
Чек по операции
Название операции␣␣Погашение кредита
Дата и время операции␣␣14.10.2026 09:15:42 (МСК)
Номер операции␣␣1000000000001
Статус␣␣Обрабатывается
Сумма операции␣␣12 500,00 ₽
Комиссия␣␣0,00 ₽
Номер договора␣␣*4321
Назначение платежа␣␣Погашение кредита по договору *4321
```

**`pdf/unknown-bank-generic.pdf`** — an unknown bank, generic labels only.
```
Банк Пример
Подтверждение платежа
Дата␣␣14.10.2026
Сумма␣␣12 500,00 ₽
Получатель␣␣Стройдвор
```

**`pdf/tbank-sbp-done-scan.pdf`** — a raster copy of `pdf/tbank-sbp-done.pdf` without a text layer (generated by rendering `pdf/tbank-sbp-done.pdf` to PNG and wrapping it in a PDF); the expected OCR text is the lines of `pdf/tbank-sbp-done.pdf`.

**`pdf/tbank-statement.pdf`** — a negative example: one page with the heading "Справка о движении средств" (Statement of account movements) and a table of two operations (a confirmed T-Bank document title); a refusal is expected: "a receipt for a single operation is needed".

## How to regenerate

```sh
cd <folder with zxing-wasm installed> && node <repo root>/fixtures/src/make-qr.mjs   # qr/*.txt, qr/*.png (zxing-wasm)
cd <repo root> && python3 -I fixtures/src/make_fixtures.py                          # photo/, pdf/, bad/ (Pillow, reportlab, DejaVu fonts)
node scripts/make-fixtures.mjs                                                      # big/ (not in git)
```

Verified 2026-10-15: zxing-wasm 3.1.4 reads the QR from all PNGs and from all three JPEGs on the first pass; exifr 7.1.3 sees
DateTimeOriginal and GPS in `exif-gps.jpg` and sees no EXIF in `receipt-qr.jpg`; pdf.js 6.3.289 extracts the Cyrillic text
from `bank-sbp-*.pdf`, and `scan-no-text.pdf` has no text.
