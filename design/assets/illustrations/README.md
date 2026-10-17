# illustrations/ — illustrations for empty and blocking states

16 SVGs in one style: flat, 2 px stroke with rounded ends (`--text-2`), a background circle, `--accent` highlights.
Canvas 160 × 120 (`welcome` is 320 × 180). There is no text in the pictures.

## How to embed

- **Inline only** (the file contents go straight into the markup, for example via a `?raw` import in Vite), not `<img>` and not
  `background-image`: the page's CSS variables are not visible from an `<img>`, so the picture would always stay light.
- The root `<svg>` already has `aria-hidden="true" focusable="false"`: the meaning is conveyed by the empty-state heading
  next to it, not by the picture. No `alt` is needed.
- The files contain no `style` attributes and no `<style>` — compatible with the app's CSP.
- The size is set by CSS (`width:160px;height:auto` or the container width); `viewBox` keeps the proportions.
- The theme switches by itself: every colour is `var(--token, #light-value)`, and the tokens come from
  `tokens/ck-tokens.css` (`[data-theme="dark"]`). That is why separate `-dark.svg` files are not needed.
- The receipt paper is light in both themes, like in `ReceiptThumb`: `--paper` `#FFFFFF`, `--paper-line` `#D7DAD3`,
  `--paper-ink` `#3D4247` (QR), `--paper-accent` `#1D6B57`, `--paper-accent-weak` `#E2EFEA`. These are not design system
  tokens: the default values always apply unless you set them explicitly.
- Tokens used: `--bg --surface --surface-2 --divider --text-2 --accent --on-accent --accent-weak --warning
  --warning-weak --danger --danger-weak`.

## File → screen / state

| File | Screen / state |
| --- | --- |
| `empty-inbox.svg` | Inbox is empty — "All sorted" («Всё разобрано») |
| `empty-operations.svg` | Operations are empty — "No operations yet" («Операций пока нет») + "Add a receipt" («Добавить чек») |
| `empty-search.svg` | Search / filters return nothing — "Nothing found" («Ничего не нашлось») |
| `empty-payees.svg` | Payees are empty |
| `empty-category.svg` | Category is empty (no operations in the category) |
| `offline.svg` | No network — receipts wait in the send queue |
| `update.svg` | "A new version is available" («Доступна новая версия») / "Update the app" («Обновите приложение») |
| `access-closed.svg` | Access closed — the key has expired or been revoked |
| `install-ios.svg` | Installing on iPhone: "Share" → "Add to Home Screen" («Поделиться» → «На экран Домой») |
| `install-android.svg` | Installing on Android: ⋮ menu → "Install app" («Установить приложение») |
| `welcome.svg` | Welcome (first screen): receipts, a family in a house, a category tree |
| `first-sync.svg` | First load of the family's data |
| `camera-permission.svg` | Camera permission (receipt photo, QR) |
| `ai-assist.svg` | AI: recognise / clarify a receipt |
| `error.svg` | Error (general), including "Gateway unavailable" («Шлюз недоступен») |
| `budget-over.svg` | Category budget exceeded (optional) |

Previews in both themes: `../preview-illustrations-light.png`, `../preview-illustrations-dark.png`.
