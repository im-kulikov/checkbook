# Button

An action button: one primary (`primary`) per screen, the rest are `secondary`, `text` or `danger`.

- Sizes: M — 44 px, L — 52 px (the main action at the bottom of the screen, full width).
- The label names the action and its object: «Сохранить в Стройка › Электрика» ("Save to Construction › Electrical"), «Отозвать доступ» ("Revoke access").
- `danger` is only for destructive actions, and always with a confirmation in a `Dialog`.
- An unavailable button is `disabled`, with the reason next to it as text («распределите ещё 1 000 ₽» ("allocate another 1 000 ₽")).
- Tokens: `accent`, `on-accent`, `surface`, `border`, `danger`; focus — the `focus` ring.
