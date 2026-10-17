# Checkbook

The design system of a family expense tracker that recognises receipts: one green accent, light and dark themes as equals, amounts in tabular figures. All screens are built from these tokens and components: mobile, desktop and sign-in screens.

## Principles

- **Numbers come first.** The amount is the largest and highest-contrast element on a screen. Amounts are never truncated; names are.
- **Colour carries meaning.** The `accent` colour is only for actions and the selected item. Status colours (`success`, `warning`, `danger`) are only for states. Colour is never the only carrier of meaning: there is always an icon and text next to it.
- **Two themes as equals.** Every screen and component exists in both a light and a dark theme. Dark is not an inversion: the accent is lighter, text on the accent is dark, weak backgrounds are muted.
- **Quiet surfaces.** Cards have no shadows: they are set apart by `surface` on `bg`. A shadow is used only on floating layers, and only in the light theme.

## Colour

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `bg` | #F4F5F2 | #111315 | Screen background |
| `surface` | #FFFFFF | #1A1D20 | Cards, lists, fields |
| `surface-2` | #ECEEEA | #24282C | Tracks, avatars, the raised layer in dark |
| `divider` | #DDE0DA | #30353A | Dividers (decorative) |
| `border` | #7A8086 | #737B83 | Borders of fields and controls |
| `text` / `text-2` | #15171A / #5B6168 | #ECEEEA / #A6ADB4 | Primary / secondary text |
| `accent` / `on-accent` | #1D6B57 / #FFFFFF | #5CC2A1 / #0B1F19 | Actions and the selected item / text on them |
| `accent-weak` | #E2EFEA | #17362E | Background of a selected suggestion and row |
| `success`, `warning`, `danger` | #2B6A1E, #8A5000, #B3261E | #7ACB6A, #F2B54A, #FF8A80 | States |
| `*-weak` | #E6F2E1, #FCEFD3, #FBE7E5 | #1A3016, #3A2B0E, #3E1B19 | State backgrounds |
| `focus` | #2457C5 | #8AB4FF | Focus ring |

Contrast is calculated with the WCAG 2.x formula for every pair in both themes (light / dark):

| Pair | Contrast |
| --- | --- |
| `text` on `bg` | 16.4 / 16.0 |
| `text-2` on `surface` | 6.3 / 7.5 |
| `accent` on `surface` | 6.4 / 7.8 |
| `on-accent` on `accent` | 6.4 / 7.9 |
| `warning` on `warning-weak` | 5.7 / 7.5 |
| `danger` on `danger-weak` | 5.5 / 6.7 |
| `border` on `surface` | 3.99 / 3.94 |
| `focus` on `bg` | 5.9 / 8.9 |

All text pairs are ≥ 4.5:1, borders and icons are ≥ 3:1. Any new colour pair is checked the same way before it appears in a mock-up.

**Exceptions to the theme.** A QR code is always black on white with a quiet zone of at least 4 modules. Receipt previews are not inverted and sit on white "paper" with a `divider` border.

**Yellow.** Light yellow is never used for text: it does not reach 4.5:1 on white. The "check this" state in the light theme is a `warning-weak` background, a border, an icon and text in the dark amber `warning`.

## Themes

- The mode is chosen in "Settings → Appearance" («Настройки → Оформление»): "Same as system" («Как в системе», the default), "Light" («Светлая»), "Dark" («Тёмная»). It is stored on the device.
- In code: `color-scheme: light dark`, a `data-theme` attribute on the root, and `prefers-color-scheme` for the "Same as system" mode. The theme is set by a script in `index.html` before the first paint, so there is no flash; two `<meta name="theme-color">` tags with `media`.
- Every screen mock-up comes in two variants: `<Screen>.dc.html` (light theme) and `<Screen>-dark.dc.html` (dark theme).

## Typography

One typeface, **Golos Text** (Google Fonts), weights 400, 500, 600. It has tabular figures, the ₽ sign, a narrow no-break space and the U+2212 minus.

- Amounts, dates, times and columns use `font-variant-numeric: tabular-nums lining-nums`, right-aligned.
- Money format is `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`. Totals are shown without kopecks, operations with kopecks.
- The scale consists of the styles `caption` … `headline` and `amount-m` … `amount-xl` (the `type` section of `tokens/tokens.json`). Layouts hold up at a system text size of 200%.

## Grid, spacing, radii

- 4 px step: 4 · 8 · 12 · 16 · 24 · 32 · 48. Screen side margin is 16 px.
- A list row is at least 56 px tall, a two-line row 64 px. Tree level indent is 16 px. Touch target is at least 44 × 44.
- Radii: 8 for tags and thumbnails; 12 for fields, buttons and banners; 16 for cards; 20 for the sheet and dialog; full for chips and the avatar.

## Icons

Outline icons on a 24 px grid, 2 px stroke, rounded ends, colour `currentColor`. Size is 22 px in navigation, 16 px in rows, 13 px inside tags. An icon without a label always gets an `aria-label`.

## Interface text

- Short and human, no error codes: "GitHub is unavailable — everything is saved on the phone, we'll send it ourselves" («GitHub недоступен — всё сохранено на телефоне, отправим сами»).
- A button names the action: "Save to Стройка › Электрика" («Сохранить в Стройка › Электрика»), not "OK".
- A category always shows its full path: "Стройка › Электрика", otherwise two "Прочее" (Other) cannot be told apart.
- Recognition confidence is labelled with its source: "from QR" («из QR»), "from PDF text" («из текста PDF»), "check this" («проверьте»), "not recognised" («не распознано»).

## Confidence states (ConfidenceField)

| Level | Appearance | Label |
| --- | --- | --- |
| High (≥ 0.9) | Regular field, no fill | ✓ and the source: "from QR" («из QR») |
| Medium (0.6–0.9) | `warning-weak` background, 2 px `warning` border | ! "Check this" («Проверьте») |
| Low or empty (< 0.6) | `danger-weak` background, 2 px `danger` border | ? "Not recognised" («Не распознано») |
| Corrected by a person | Regular field | "manual" («вручную») in `text-2` colour |

## Patterns

- **Category picker** = bottom sheet + search + `SuggestionRadio` (3 suggestions) + `TreeRow` in selection mode with a "Select this level" button («Выбрать этот уровень»).
- **Merging payees** = checkmarks in the list + a `Dialog` "Main name" («Главное имя»).
- **Filters** = `Chip` + bottom sheet.
- **Moving a category** is done via "Move to…" («Перенести в…»), with no mandatory drag and drop (WCAG 2.5.7).
- **Swipes** are only a shortcut; every swipe has a button in the row menu.

## Accessibility

Text at 4.5:1 in both themes, borders and icons at 3:1, touch targets 44 × 44, focus always visible, VoiceOver and TalkBack read the amount and the confidence as text, `prefers-reduced-motion` turns animations off.

## How to use in mock-ups

Component classes start with `ck-` and live in `components/bundle.css`; colours are only `var(--token)`. The screen root gets `data-theme="light"` or `data-theme="dark"`. Every component preview shows both themes side by side.
