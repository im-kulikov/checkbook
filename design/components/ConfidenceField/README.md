# ConfidenceField

A field with a recognition result: it shows the value, the confidence level and the source.

- High (≥ 0.9): an ordinary field, ✓ and the source in the `success` colour («из QR» ("from QR"), «из текста PDF» ("from PDF text")).
- Medium (0.6–0.9): `warning-weak` background, 2 px `warning` border, «! проверьте» ("! check").
- Low or empty: `danger-weak` background, 2 px `danger` border, «? не распознано» ("? not recognised"); the form cannot be confirmed.
- After a manual edit — a neutral «вручную» ("manually").
- A screen reader reads «Сумма, 12 500 рублей, из QR, точно» ("Amount, 12 500 roubles, from QR, exact"): the level is always given as text.
