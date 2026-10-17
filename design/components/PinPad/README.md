# PinPad

A 6-digit PIN keypad for unlocking when Face ID or a fingerprint is unavailable.

- Five wrong attempts in a row — a 5-minute pause with a countdown.
- A caption next to it: «Блокировка экрана, не шифрование» ("Screen lock, not encryption") if the device does not support PRF.
- Buttons are 64 px; the entry dots are announced as a number («введено 2 цифры из 6» ("2 digits of 6 entered")).
