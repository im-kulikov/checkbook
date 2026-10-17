# splash/ — iOS splash screens (`apple-touch-startup-image`)

iOS does not build a splash screen from the manifest: it needs an image that exactly matches the screen's pixels and a `<link>` with an exact media query.
There are 25 sizes × 2 themes = 50 PNGs here, without an alpha channel, compressed with pngquant + oxipng.

- Light: background `#F4F5F2`, mark `logo/mark.svg`, "Чекбук" in `#15171A`. Dark: background `#111315`, `logo/mark-dark.svg`, "Чекбук" in `#ECEEEA`.
- The mark is 22% of the short side, with the lettering under it in outlines (Golos Text 600); the group is centred, slightly above the middle.
- Where to put them: files → `public/splash/`, lines from `links.html` → `<head>` in `index.html`. You also need
  `<meta name="apple-mobile-web-app-capable" content="yes">` (without it iOS does not show splash screens).
- Do not cache them in the service worker (`globIgnores: ['splash/**']`, configured in `vite.config.ts`).
- For iPad landscape, `device-width`/`device-height` are the **portrait** values (WebKit does not swap them); only
  `orientation` and the image size change.
- The background colour of the app's first frame must match the splash screen (`html{background:#F4F5F2}`, dark `#111315`).

## Dark splash screen — check on a device

The dark set is selected with `and (prefers-color-scheme: dark)`, the light one with `and (prefers-color-scheme: light)`.
It is not known whether iOS 26 reads the theme on every cold start or remembers a single image at install time.
To check: install, turn on the dark appearance, close the app from the app switcher, launch it. Then do the reverse.
**If the dark one is not picked up** (or the wrong one is shown), keep only the light lines in `<head>` and remove
`and (prefers-color-scheme: light)` from them; otherwise nothing will match in the dark theme and iOS will show a blank screen.

There is no image for the iPhone Duo (foldable): its points and DPR are unknown, so the default splash screen is used.

## Sizes

| Files | Pixels | device-width × device-height | DPR | Orientation | Devices |
| --- | --- | --- | --- | --- | --- |
| `apple-splash-1320x2868-light.png` / `-dark.png` | 1320×2868 | 440×956 | 3 | portrait | iPhone 16 Pro Max, 17 Pro Max, 18 Pro Max |
| `apple-splash-1206x2622-light.png` / `-dark.png` | 1206×2622 | 402×874 | 3 | portrait | iPhone 16 Pro, 17, 17 Pro, 18 Pro |
| `apple-splash-1260x2736-light.png` / `-dark.png` | 1260×2736 | 420×912 | 3 | portrait | iPhone Air |
| `apple-splash-1290x2796-light.png` / `-dark.png` | 1290×2796 | 430×932 | 3 | portrait | iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus |
| `apple-splash-1179x2556-light.png` / `-dark.png` | 1179×2556 | 393×852 | 3 | portrait | iPhone 14 Pro, 15, 15 Pro, 16 |
| `apple-splash-1284x2778-light.png` / `-dark.png` | 1284×2778 | 428×926 | 3 | portrait | iPhone 12 Pro Max, 13 Pro Max, 14 Plus |
| `apple-splash-1170x2532-light.png` / `-dark.png` | 1170×2532 | 390×844 | 3 | portrait | iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e, 17e |
| `apple-splash-1125x2436-light.png` / `-dark.png` | 1125×2436 | 375×812 | 3 | portrait | iPhone 11 Pro, 12 mini, 13 mini |
| `apple-splash-1242x2688-light.png` / `-dark.png` | 1242×2688 | 414×896 | 3 | portrait | iPhone 11 Pro Max |
| `apple-splash-828x1792-light.png` / `-dark.png` | 828×1792 | 414×896 | 2 | portrait | iPhone 11 |
| `apple-splash-750x1334-light.png` / `-dark.png` | 750×1334 | 375×667 | 2 | portrait | iPhone SE (2nd/3rd gen) |
| `apple-splash-2064x2752-light.png` / `-dark.png` | 2064×2752 | 1032×1376 | 2 | portrait | iPad Pro 13" (M4/M5) |
| `apple-splash-2752x2064-light.png` / `-dark.png` | 2752×2064 | 1032×1376 | 2 | landscape | iPad Pro 13" (M4/M5) |
| `apple-splash-2048x2732-light.png` / `-dark.png` | 2048×2732 | 1024×1366 | 2 | portrait | iPad Pro 12.9", iPad Air 13" |
| `apple-splash-2732x2048-light.png` / `-dark.png` | 2732×2048 | 1024×1366 | 2 | landscape | iPad Pro 12.9", iPad Air 13" |
| `apple-splash-1668x2420-light.png` / `-dark.png` | 1668×2420 | 834×1210 | 2 | portrait | iPad Pro 11" (M4/M5) |
| `apple-splash-2420x1668-light.png` / `-dark.png` | 2420×1668 | 834×1210 | 2 | landscape | iPad Pro 11" (M4/M5) |
| `apple-splash-1668x2388-light.png` / `-dark.png` | 1668×2388 | 834×1194 | 2 | portrait | iPad Pro 11" 1st–4th gen |
| `apple-splash-2388x1668-light.png` / `-dark.png` | 2388×1668 | 834×1194 | 2 | landscape | iPad Pro 11" 1st–4th gen |
| `apple-splash-1640x2360-light.png` / `-dark.png` | 1640×2360 | 820×1180 | 2 | portrait | iPad Air 11"/10.9", iPad 11"/10th gen |
| `apple-splash-2360x1640-light.png` / `-dark.png` | 2360×1640 | 820×1180 | 2 | landscape | iPad Air 11"/10.9", iPad 11"/10th gen |
| `apple-splash-1620x2160-light.png` / `-dark.png` | 1620×2160 | 810×1080 | 2 | portrait | iPad 10.2" |
| `apple-splash-2160x1620-light.png` / `-dark.png` | 2160×1620 | 810×1080 | 2 | landscape | iPad 10.2" |
| `apple-splash-1488x2266-light.png` / `-dark.png` | 1488×2266 | 744×1133 | 2 | portrait | iPad mini 8.3" |
| `apple-splash-2266x1488-light.png` / `-dark.png` | 2266×1488 | 744×1133 | 2 | landscape | iPad mini 8.3" |
