# AppBar

The screen header: either a root one (large title, sync indicator, search) or a nested one (back, title, «⋯» menu).

- Height from 56 px; in the installed iOS app `env(safe-area-inset-top)` is added, and the bar itself paints that area.
- On root screens the right-hand slot is taken by `SyncIndicator`.
