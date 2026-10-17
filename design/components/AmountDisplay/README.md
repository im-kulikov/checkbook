# AmountDisplay

An amount: tabular figures, a narrow non-breaking space between digit groups, the ₽ sign after the number.

- Sizes: XL 36 px (period total), L 28 px (category total, operation amount), M 17 px (rows).
- Expenses are shown without a sign. A refund is shown with «+» and the `success` colour, always with a tag or the caption «возврат» ("refund"). A transfer to one's own uses the `text-2` colour.
- Totals are shown without kopecks, operations with kopecks. An amount is never truncated.
