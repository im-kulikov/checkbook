# Illustration

16 illustrations for empty and blocking states. One style: flat, a 2 px stroke with rounded caps (`--text-2`), a background circle and `--accent` highlights. Canvas 160 × 120 (`welcome` — 320 × 180), no text inside the pictures.

- **Inline SVG** only (not `<img>`, not `background-image`): colours are set as `var(--token, #light)`, so the theme switches by itself and there are no separate dark files. The root `<svg>` is already `aria-hidden`: the meaning is carried by the heading next to it.
- The width is set by CSS (`width:160px;height:auto`), the splash screen — up to 220 px. The receipt paper stays light in both themes.
- It sits above the `EmptyState` heading or in the centre of a blocking screen.

| File | Where |
| --- | --- |
| `empty-inbox` | Inbox is empty — «Всё разобрано» ("All sorted") |
| `empty-operations` | No operations yet |
| `empty-search` | Nothing found |
| `empty-payees` | No payees |
| `empty-category` | No operations in the category |
| `offline` | No network, receipts queued |
| `update` | Update the app |
| `access-closed` | Access closed |
| `install-ios` | Installation on iPhone |
| `install-android` | Installation on Android |
| `welcome` | Welcome |
| `first-sync` | First load |
| `camera-permission` | Camera permission |
| `ai-assist` | AI: recognise / clarify |
| `error` | Generic error, «Шлюз недоступен» ("Gateway unavailable") |
| `budget-over` | Budget exceeded (optional) |
