# SyncIndicator

A permanent sync indicator in the header of root screens: icon + text.

- States: «Синхронизировано» ("Synced", `success`), «N в очереди» ("N queued", `warning`), «Нет сети · N ждут» ("No network · N waiting", neutral), «Доступ закрыт» ("Access closed", `danger`).
- Tapping leads to «Настройки → Синхронизация» ("Settings → Sync"). Send errors are duplicated in «Входящие» ("Inbox").
