# splash/ — заставки iOS (`apple-touch-startup-image`)

iOS не строит заставку из манифеста: нужна картинка ровно под пиксели экрана и `<link>` с точным media-запросом.
Здесь 25 размеров × 2 темы = 50 PNG, без альфа-канала, сжаты pngquant + oxipng.

- Светлая: фон `#F4F5F2`, знак `logo/mark.svg`, «Чекбук» `#15171A`. Тёмная: фон `#111315`, `logo/mark-dark.svg`, «Чекбук» `#ECEEEA`.
- Знак — 22 % короткой стороны, под ним надпись в кривых (Golos Text 600); группа по центру, чуть выше середины.
- Куда: файлы → `public/splash/`, строки из `links.html` → `<head>` в `index.html`. Нужен
  `<meta name="apple-mobile-web-app-capable" content="yes">` (без него iOS заставки не показывает).
- В service worker не кэшировать (`globIgnores: ['splash/**']`, так настроено в `vite.config.ts`).
- Для ландшафта iPad `device-width`/`device-height` — **портретные** (WebKit их не поворачивает), меняется только
  `orientation` и размер картинки.
- Цвет фона первого кадра приложения должен совпадать с заставкой (`html{background:#F4F5F2}`, тёмная `#111315`).

## Тёмная заставка — проверить на устройстве

Тёмный набор выбирается по `and (prefers-color-scheme: dark)`, светлый — по `and (prefers-color-scheme: light)`.
Неизвестно, читает ли iOS 26 тему при каждом холодном старте или запоминает одну картинку при установке.
Проверка: установить, включить тёмное оформление, закрыть приложение из переключателя, запустить. Затем обратно.
**Если тёмная не подхватывается** (или показывается не та) — оставить в `<head>` только светлые строки и убрать из
них `and (prefers-color-scheme: light)`, иначе в тёмной теме совпадений не будет совсем и iOS покажет пустой экран.

Нет картинки под iPhone Duo (складной): его точки и DPR неизвестны, будет заставка по умолчанию.

## Размеры

| Файлы | Пиксели | device-width × device-height | DPR | Ориентация | Устройства |
| --- | --- | --- | --- | --- | --- |
| `apple-splash-1320x2868-light.png` / `-dark.png` | 1320×2868 | 440×956 | 3 | портрет | iPhone 16 Pro Max, 17 Pro Max, 18 Pro Max |
| `apple-splash-1206x2622-light.png` / `-dark.png` | 1206×2622 | 402×874 | 3 | портрет | iPhone 16 Pro, 17, 17 Pro, 18 Pro |
| `apple-splash-1260x2736-light.png` / `-dark.png` | 1260×2736 | 420×912 | 3 | портрет | iPhone Air |
| `apple-splash-1290x2796-light.png` / `-dark.png` | 1290×2796 | 430×932 | 3 | портрет | iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus |
| `apple-splash-1179x2556-light.png` / `-dark.png` | 1179×2556 | 393×852 | 3 | портрет | iPhone 14 Pro, 15, 15 Pro, 16 |
| `apple-splash-1284x2778-light.png` / `-dark.png` | 1284×2778 | 428×926 | 3 | портрет | iPhone 12 Pro Max, 13 Pro Max, 14 Plus |
| `apple-splash-1170x2532-light.png` / `-dark.png` | 1170×2532 | 390×844 | 3 | портрет | iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e, 17e |
| `apple-splash-1125x2436-light.png` / `-dark.png` | 1125×2436 | 375×812 | 3 | портрет | iPhone 11 Pro, 12 mini, 13 mini |
| `apple-splash-1242x2688-light.png` / `-dark.png` | 1242×2688 | 414×896 | 3 | портрет | iPhone 11 Pro Max |
| `apple-splash-828x1792-light.png` / `-dark.png` | 828×1792 | 414×896 | 2 | портрет | iPhone 11 |
| `apple-splash-750x1334-light.png` / `-dark.png` | 750×1334 | 375×667 | 2 | портрет | iPhone SE (2nd/3rd gen) |
| `apple-splash-2064x2752-light.png` / `-dark.png` | 2064×2752 | 1032×1376 | 2 | портрет | iPad Pro 13" (M4/M5) |
| `apple-splash-2752x2064-light.png` / `-dark.png` | 2752×2064 | 1032×1376 | 2 | ландшафт | iPad Pro 13" (M4/M5) |
| `apple-splash-2048x2732-light.png` / `-dark.png` | 2048×2732 | 1024×1366 | 2 | портрет | iPad Pro 12.9", iPad Air 13" |
| `apple-splash-2732x2048-light.png` / `-dark.png` | 2732×2048 | 1024×1366 | 2 | ландшафт | iPad Pro 12.9", iPad Air 13" |
| `apple-splash-1668x2420-light.png` / `-dark.png` | 1668×2420 | 834×1210 | 2 | портрет | iPad Pro 11" (M4/M5) |
| `apple-splash-2420x1668-light.png` / `-dark.png` | 2420×1668 | 834×1210 | 2 | ландшафт | iPad Pro 11" (M4/M5) |
| `apple-splash-1668x2388-light.png` / `-dark.png` | 1668×2388 | 834×1194 | 2 | портрет | iPad Pro 11" 1st–4th gen |
| `apple-splash-2388x1668-light.png` / `-dark.png` | 2388×1668 | 834×1194 | 2 | ландшафт | iPad Pro 11" 1st–4th gen |
| `apple-splash-1640x2360-light.png` / `-dark.png` | 1640×2360 | 820×1180 | 2 | портрет | iPad Air 11"/10.9", iPad 11"/10th gen |
| `apple-splash-2360x1640-light.png` / `-dark.png` | 2360×1640 | 820×1180 | 2 | ландшафт | iPad Air 11"/10.9", iPad 11"/10th gen |
| `apple-splash-1620x2160-light.png` / `-dark.png` | 1620×2160 | 810×1080 | 2 | портрет | iPad 10.2" |
| `apple-splash-2160x1620-light.png` / `-dark.png` | 2160×1620 | 810×1080 | 2 | ландшафт | iPad 10.2" |
| `apple-splash-1488x2266-light.png` / `-dark.png` | 1488×2266 | 744×1133 | 2 | портрет | iPad mini 8.3" |
| `apple-splash-2266x1488-light.png` / `-dark.png` | 2266×1488 | 744×1133 | 2 | ландшафт | iPad mini 8.3" |
