# TabBar

The phone's bottom navigation: Обзор ("Overview") · Операции ("Operations") · «+» · Входящие ("Inbox") · Ещё ("More").

- The central «+» opens the «Добавить» ("Add") sheet; there is no separate floating button.
- The «Входящие» badge counts only «Проверить» ("Review") and «Не отправлено» ("Not sent"); `aria-label` — «Входящие, 3 новых» ("Inbox, 3 new").
- The active tab is `accent` with `aria-current="page"`. `env(safe-area-inset-bottom)` is taken into account at the bottom.
- On desktop, a side list of sections replaces the bar.
