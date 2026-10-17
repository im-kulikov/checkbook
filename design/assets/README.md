# design/assets — logo, icons, splash screens, illustrations for Checkbook

**Mark:** an open book made of two receipts — the pages have a zigzag torn bottom edge, the left page has lines of text, the right page a checkmark
(«чек» "receipt" + «бук» "book", the name Чекбук). One accent colour `#1D6B57` and white; in the dark theme the tile is `#17362E` and the pages `#5CC2A1`.
Flat, no gradients. All lettering is converted to outlines, so the SVGs do not depend on fonts.

## Important: the icon and name are frozen at install time

iOS remembers `apple-touch-icon`, the name (`apple-mobile-web-app-title` / `short_name`), `start_url`, `scope` and
`display` at the moment of "Add to Home Screen" and **never updates them again** (WebKit 216197). Any change means every family member
has to delete the app and add it again, and a reinstall on iOS gets an **empty** local storage (send queue,
token, cache). That is why these files are final: replace them in `public/` **before the family's first install** and
do not touch them afterwards. Android updates the manifest icon on its own, but not immediately.

## Files

| File | Size | Purpose | Path in the app (`public/`) |
| --- | --- | --- | --- |
| `logo/mark.svg` | 512 × 512 (viewBox) | Mark on a tile, light theme. Source for the iOS splash screens | — |
| `logo/mark-dark.svg` | 512 × 512 | Mark for a dark background: tile `#17362E`, pages `#5CC2A1` | — |
| `logo/lockup.svg` | ≈ 3.9 : 1 | Mark + the "Чекбук" wordmark in one line, for a light background | — |
| `logo/lockup-dark.svg` | ≈ 3.9 : 1 | The same for a dark background (text `#ECEEEA`) | — |
| `logo/wordmark.svg` | ≈ 3.7 : 1 | Lettering only, Golos Text 600 in outlines, `#15171A` | — |
| `icons/apple-touch-icon.png` | 180 × 180, RGB, no alpha | iOS/iPadOS Home Screen icon. A square without rounded corners — iOS rounds it itself | `/apple-touch-icon.png` |
| `icons/pwa-192.png` | 192 × 192, RGBA | Manifest, `purpose: "any"` — a rounded tile on a transparent background | `/pwa-192.png` |
| `icons/pwa-512.png` | 512 × 512, RGBA | Manifest, `purpose: "any"`, Android splash screen | `/pwa-512.png` |
| `icons/maskable-512.png` | 512 × 512, RGB, no alpha | Manifest, `purpose: "maskable"`: background fills the whole square, mark inside a circle of r = 40% (actual: 34%) | `/maskable-512.png` |
| `icons/favicon.svg` | 32 × 32 (viewBox) | Browser tab; simplified mark, switches itself via `prefers-color-scheme: dark` | `/favicon.svg` |
| `icons/favicon.ico` | 16 + 32 + 48 | Fallback tab icon (the 16 px size has a pixel-drawn checkmark) | `/favicon.ico` |
| `icons/icon-1024.png` | 1024 × 1024, RGB | Master for stores/social networks/generators; not needed in `public/` | — |
| `splash/apple-splash-{W}x{H}-{light,dark}.png` | 25 sizes × 2 | iOS splash screens; details and the dark theme check — [`splash/README.md`](splash/README.md) | `/splash/*` |
| `splash/links.html` | 50 lines | Ready-made `<link rel="apple-touch-startup-image">` tags for `<head>` | in `index.html` |
| `illustrations/*.svg` | 160 × 120 (welcome 320 × 180) | 16 illustrations for empty/blocking screens, they switch theme themselves, no separate `-dark.svg` files; rules — [`illustrations/README.md`](illustrations/README.md) | in `src/` (inline) |
| `preview-*.png` | — | Review sheets: logo, icons (iOS mask, safe circle), splash screens, illustrations in light/dark | do not publish |

`head` (as in `index.html`):

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<!-- + lines from splash/links.html -->
```

The manifest already references `/pwa-192.png`, `/pwa-512.png` (`any`) and `/maskable-512.png` (`maskable`); iOS uses
only `apple-touch-icon` and ignores `maskable`.

## Colours

| | Light | Dark |
| --- | --- | --- |
| Mark tile | `#1D6B57` (accent) | `#17362E` (accent-weak) |
| Pages | `#FFFFFF` | `#5CC2A1` (accent) |
| Lines, checkmark | `#1D6B57` | `#17362E` |
| Lettering | `#15171A` (text) | `#ECEEEA` (text) |
| Splash background | `#F4F5F2` (bg) | `#111315` (bg) |

## Verified programmatically

- `apple-touch-icon.png` 180 × 180, `maskable-512.png`, `icon-1024.png` — RGB mode, no alpha channel.
- The mark in `maskable-512.png` lies entirely within a circle of radius 34% (tolerance: 40%).
- All 50 splash screens are exactly their stated sizes, background `#F4F5F2` / `#111315`; about 0.6 MB in total.
- `favicon.ico` contains 16, 32, 48.
- In the illustrations every colour is `var(--…, #…)`; there are no fonts or text and no `style`.
