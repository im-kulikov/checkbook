# design/ — Checkbook design system and screen mock-ups

This directory holds the design system (principles, tokens, components), screen mock-ups in light and dark themes, the logo, icons, iOS splash screens and illustrations. The mock-ups are a reference for markup and the `ck-*` classes, not code to copy: the app has no `style="…"` attributes (CSP) and no Google Fonts (the font comes from `@fontsource/golos-text`).

## Contents

| Path | What |
| --- | --- |
| [`system.md`](system.md) | Design system README: principles, colour and contrast, themes, typography, spacing |
| `tokens/ck-tokens.css` | CSS variables for both themes (`:root,[data-theme="light"]` and `[data-theme="dark"]`) |
| `tokens/tokens.json` | the same tokens in JSON (for the contrast test) |
| `components/bundle.css` | CSS for all components (remove the first line, the Google Fonts `@import`, when porting) |
| `components/<Name>/README.md` | component rules (variants, states, accessibility) |
| `screens/<Screen>.dc.html`, `screens/<Screen>-dark.dc.html` | screen mock-up in the light and dark theme, 390 × 844 |
| `screens/png/<Screen>-light.png`, `<Screen>-dark.png` | raster previews of the mock-ups (for quick viewing) |
| `assets/logo/mark.svg`, `mark-dark.svg`, `lockup.svg`, `lockup-dark.svg`, `wordmark.svg` | logo (source for the iOS splash screens) |
| `assets/icons/apple-touch-icon.png` (180, no alpha), `pwa-192.png`, `pwa-512.png`, `maskable-512.png` (no alpha), `favicon.svg` | **final** icons: iOS remembers them permanently at install time |
| `assets/illustrations/<name>.svg` | illustrations for empty and blocking screens; one file for both themes, colours via CSS variables, no separate `-dark` files |

For details on the logo, icons, splash screens and illustrations, see [`assets/README.md`](assets/README.md).

If `public/` still holds temporary icons, replace them with the final ones from `assets/icons/` **before the family first installs the app**.

## Components (32)

ActionTile, AmountDisplay, AppBar, Avatar, Banner, BottomSheet, Button, CategoryPath, Chip, ConfidenceField, Dialog, EmptyState, IconButton, Illustration, ListRow, Logo, OperationRow, PinPad, QRBlock, ReceiptThumb, Segmented, ShareBar, SplitPart, StatusTag, StepIndicator, SuggestionRadio, Switch, SyncIndicator, TabBar, TextField, Toast, TreeRow.

## Screens

| Area | Screens |
| --- | --- |
| Main sections | Main, Operations, Inbox (empty states), More |
| Installation and access | InstallIOS, Welcome, SetupKey, Invite, JoinQR, Members, Unlock, AccessClosed |
| Adding a receipt | Add, Manual, Picker, Category, Review, Split, Inbox |
| Operations and directories | Operations, Operation, Payees, Categories |
| Settings | Settings (Appearance, About), AISettings |
| Desktop | Desktop |

The directory also contains other mock-ups: Conflict, Diagnostics, Export, FirstSync, InboxEmpty, InstallAndroid, Launch, MainOffline, SetupCategories, SetupExisting, SetupRepo, UpdateRequired.

`B-Inbox` and `C-Stroyka` are mock-ups of alternative concepts: they are not implemented as screens; the "Accept" action in Inbox («Принять») and the per-category budget were taken from them.
