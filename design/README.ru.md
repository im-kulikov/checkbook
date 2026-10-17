# design/ — дизайн-система «Чекбук» и макеты экранов

Здесь лежат дизайн-система (принципы, токены, компоненты), макеты экранов в светлой и тёмной темах, логотип, иконки, заставки iOS и иллюстрации. Макеты — образец вёрстки и классов `ck-*`, а не код для копирования: в приложении нет атрибутов `style="…"` (CSP) и нет Google Fonts (шрифт — `@fontsource/golos-text`).

## Содержимое

| Путь | Что |
| --- | --- |
| [`system.ru.md`](system.ru.md) | README дизайн-системы: принципы, цвет и контраст, темы, типографика, отступы |
| `tokens/ck-tokens.css` | CSS-переменные обеих тем (`:root,[data-theme="light"]` и `[data-theme="dark"]`) |
| `tokens/tokens.json` | те же токены в JSON (для теста контраста) |
| `components/bundle.css` | CSS всех компонентов (первую строку `@import` Google Fonts при переносе удалить) |
| `components/<Имя>/README.md` | правила компонента (варианты, состояния, доступность) |
| `screens/<Экран>.dc.html`, `screens/<Экран>-dark.dc.html` | макет экрана в светлой и тёмной теме, 390 × 844 |
| `screens/png/<Экран>-light.png`, `<Экран>-dark.png` | растровые превью макетов (для быстрого просмотра) |
| `assets/logo/mark.svg`, `mark-dark.svg`, `lockup.svg`, `lockup-dark.svg`, `wordmark.svg` | логотип (исходник заставок iOS) |
| `assets/icons/apple-touch-icon.png` (180, без альфы), `pwa-192.png`, `pwa-512.png`, `maskable-512.png` (без альфы), `favicon.svg` | **финальные** иконки: iOS запоминает их при установке навсегда |
| `assets/illustrations/<имя>.svg` | иллюстрации пустых и блокирующих экранов; один файл на обе темы, цвета через CSS-переменные, отдельных `-dark` нет |

Подробнее о логотипе, иконках, заставках и иллюстрациях — в [`assets/README.ru.md`](assets/README.ru.md).

Если в `public/` пока лежат временные иконки, их нужно заменить финальными из `assets/icons/` **до первой установки приложения семьёй**.

## Компоненты (32)

ActionTile, AmountDisplay, AppBar, Avatar, Banner, BottomSheet, Button, CategoryPath, Chip, ConfidenceField, Dialog, EmptyState, IconButton, Illustration, ListRow, Logo, OperationRow, PinPad, QRBlock, ReceiptThumb, Segmented, ShareBar, SplitPart, StatusTag, StepIndicator, SuggestionRadio, Switch, SyncIndicator, TabBar, TextField, Toast, TreeRow.

## Экраны

| Раздел | Экраны |
| --- | --- |
| Основные разделы | Main, Operations, Inbox (пустые состояния), More |
| Установка и доступ | InstallIOS, Welcome, SetupKey, Invite, JoinQR, Members, Unlock, AccessClosed |
| Добавление чека | Add, Manual, Picker, Category, Review, Split, Inbox |
| Операции и справочники | Operations, Operation, Payees, Categories |
| Настройки | Settings (Оформление, О приложении), AISettings |
| Десктоп | Desktop |

В каталоге есть и другие макеты: Conflict, Diagnostics, Export, FirstSync, InboxEmpty, InstallAndroid, Launch, MainOffline, SetupCategories, SetupExisting, SetupRepo, UpdateRequired.

`B-Inbox` и `C-Stroyka` — макеты альтернативных концепций: не реализуются как экраны; из них взяты «Принять» во Входящих и бюджет у категории.
