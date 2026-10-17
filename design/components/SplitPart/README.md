# SplitPart

One part of a split receipt: category, amount, note; plus a remainder row under all the parts.

- The last part receives the remainder automatically and is labelled «остаток — подставлен сам» ("remainder — filled in automatically").
- Remainder: 0 — `success` «✓ распределено» ("✓ allocated"); more than 0 — `warning` «осталось распределить» ("left to allocate"); less than 0 — `danger` «больше суммы чека» ("more than the receipt total"). Saving is possible only at 0.
