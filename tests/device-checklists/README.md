# Manual checks on real devices

[Русская версия](README.ru.md)

Cases that can only be checked by hand on a phone or with an operator script. One row per case, the case ID first.
"Do" and "Expected" may be shortened but must keep the meaning. Results are recorded per platform and OS version only.

| File | What |
| --- | --- |
| `github.md` | GitHub settings and commit signing |
| `ios.md` | iPhone and iPad: iOS 26.x, iOS 27.0, iOS 18.x when available |
| `android.md` | Android, Chrome 125+ |
| `spike-report.md` | results of the early device spike (installability, camera, storage) |

Row format (device cells: ✓ passed, ✗ failed — open an issue, "—" not applicable):

```
| ID | Do | Expected | iOS 26 | iOS 27 | iOS 18 |
| I09 | «Сфотографировать чек» → photograph a receipt | no permission prompt, QR read | ☐ | ☐ | ☐ |
```

User scenarios (UC-1…UC-16) are recorded the same way, in the file of the platform they were checked on.
