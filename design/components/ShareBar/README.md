# ShareBar

A share bar (4 px) in the tree and a budget bar (8 px) in a category.

- Budget: up to 80 % — `accent`, from 80 % — `warning`, exceeded — `danger`, and always with text next to it («62 % · 1 248 300 из 2 000 000 ₽» ("62 % · 1 248 300 of 2 000 000 ₽"), «Превышен на 12 400 ₽» ("Exceeded by 12 400 ₽")).
- The budget bar is `role="img"` with `aria-label`; the share bar in the tree is decorative, since the amount has already been read in the row.
