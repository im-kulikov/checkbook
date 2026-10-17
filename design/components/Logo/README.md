# Logo

The «Чекбук» ("Checkbook") mark: a check-book with a tick on a rounded tile. Two variants: light (`mark.svg`) and dark (`mark-dark.svg`), and a lockup with the word «Чекбук» (`lockup.svg`, `lockup-dark.svg`).

- Mark sizes: 64 px (welcome, splash screen — up to 112 px), 40 px (headers, dialogs). Nothing smaller than 28 px is used.
- **Inline SVG** only, not `<img>`: both variants are placed side by side and the right one is shown by `[data-theme="dark"]` (`[data-lm="d"]{display:none}` and the inverse selector). The mark's colours are fixed, it needs no tokens.
- The lockup is for screens with horizontal room (desktop, «О приложении» ("About")); on the phone — the mark, with the name on a separate line.
- The clear space around the mark is at least a quarter of its side. Do not recolour it, rotate it, or place it on a coloured background.
- Files: `mark.svg`, `mark-dark.svg`, `lockup.svg`, `lockup-dark.svg`.
