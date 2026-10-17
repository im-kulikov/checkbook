# StepIndicator

Wizard progress: the text «Шаг 2 из 4 · Ключ GitHub» ("Step 2 of 4 · GitHub key") and a bar of segments.

- The text carries the meaning; the bar is a visual hint (`aria-hidden`).
- The step is saved in IndexedDB: on iOS, going to github.com takes the user out of the app.
