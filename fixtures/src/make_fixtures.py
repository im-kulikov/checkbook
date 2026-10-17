"""Regenerates the synthetic fixtures in fixtures/{photo,pdf,bad}. All data is fake (see fixtures/README.md).

Needs Python 3 with Pillow and reportlab, and the DejaVu fonts (Ubuntu: fonts-dejavu-core).
Run make-qr.mjs first (the photos embed fixtures/qr/R02.png):  python3 -I fixtures/src/make_fixtures.py
"""
import io
import random
from pathlib import Path

from PIL import ExifTags, Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
random.seed(20261015)  # reproducible noise

# ---------- cash receipt photos (FNS QR, R02 payload) ----------
RECEIPT = [
    ("ООО «СТРОЙДВОР»", True),
    ("ИНН 7700000009", False),
    ("г. Москва, ул. Тестовая, 1", False),
    ("КАССОВЫЙ ЧЕК / ПРИХОД", True),
    ("15.10.26 14:30          Смена 12", False),
    ("Кабель ВВГнг 3х2,5", False),
    ("   1 x 8 000,00         =8 000,00", False),
    ("Автомат 16А", False),
    ("   3 x 1 500,00         =4 500,00", False),
    ("ИТОГ                   =12 500,00", True),
    ("БЕЗНАЛИЧНЫМИ           =12 500,00", False),
    ("СУММА НДС 20%           =2 083,33", False),
    ("ФН 7380440700076549", False),
    ("ФД 41250   ФП 2829170618", False),
]


def receipt_paper():
    w, h = 900, 1700
    im = Image.new("L", (w, h), 246)
    d = ImageDraw.Draw(im)
    f, fb = ImageFont.truetype(MONO, 34), ImageFont.truetype(MONO, 36)
    y = 60
    for text, bold in RECEIPT:
        d.text((50, y), text, font=fb if bold else f, fill=25)
        y += 62
    qr = Image.open(ROOT / "qr" / "R02.png").convert("L")
    qr = qr.resize((330, 330 * qr.height // qr.width), Image.NEAREST)
    im.paste(qr, ((w - qr.width) // 2, y + 30))
    y += qr.height + 70
    d.text((50, y), "ТЕСТОВЫЙ ЧЕК — ДАННЫЕ ВЫМЫШЛЕНЫ", font=f, fill=60)
    return im.crop((0, 0, w, y + 90))


def photo(paper, angle, blur, noise, size=(1600, 2200)):
    bg = Image.new("L", size, 92)  # table
    rotated = paper.rotate(angle, expand=True, fillcolor=0, resample=Image.BICUBIC)
    mask = Image.new("L", paper.size, 255).rotate(angle, expand=True, fillcolor=0)
    bg.paste(rotated, ((size[0] - rotated.width) // 2, (size[1] - rotated.height) // 2), mask)
    if blur:
        bg = bg.filter(ImageFilter.GaussianBlur(blur))
    px = bg.load()
    for _ in range(size[0] * size[1] // 6):
        x, y = random.randrange(size[0]), random.randrange(size[1])
        px[x, y] = max(0, min(255, px[x, y] + random.randint(-noise, noise)))
    # uneven light: darker towards the bottom
    shade = Image.linear_gradient("L").resize(size).point(lambda v: 255 - v // 5)
    return Image.composite(bg, Image.new("L", size, 0), shade).convert("RGB")


paper = receipt_paper()
photo(paper, 4, 0.6, 18).save(ROOT / "photo" / "receipt-qr.jpg", quality=85)
photo(paper, 17, 2.2, 30).save(ROOT / "photo" / "receipt-qr-rotated-blurred.jpg", quality=70)

# JPEG with EXIF DateTimeOriginal + GPS (fake coordinates) for EXIF/GPS stripping tests.
small = photo(paper, 2, 0.4, 12).resize((800, 1100))
exif = Image.Exif()
exif[ExifTags.Base.Make] = "TestCam"
exif[ExifTags.Base.Model] = "Fixture 1"
exif[ExifTags.Base.DateTime] = "2026:10:15 14:31:12"
sub = exif.get_ifd(ExifTags.IFD.Exif)
sub[ExifTags.Base.DateTimeOriginal] = "2026:10:15 14:31:12"
sub[ExifTags.Base.OffsetTimeOriginal] = "+03:00"
gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
gps[ExifTags.GPS.GPSLatitudeRef] = "N"
gps[ExifTags.GPS.GPSLatitude] = (55.0, 45.0, 21.0)
gps[ExifTags.GPS.GPSLongitudeRef] = "E"
gps[ExifTags.GPS.GPSLongitude] = (37.0, 37.0, 3.0)
small.save(ROOT / "photo" / "exif-gps.jpg", quality=85, exif=exif)

# ---------- bank receipts with a text layer (same SBP id: «В обработке» then «Исполнен», R18) ----------
pdfmetrics.registerFont(TTFont("DejaVu", FONT))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", FONT_B))


def bank_pdf(path, status, created):
    c = canvas.Canvas(str(path), pagesize=A5)
    c.setTitle("Квитанция (тестовая)")
    c.setAuthor("fixtures")
    c.setCreator("checkbook fixtures")
    w, h = A5
    y = h - 22 * mm
    c.setFont("DejaVu-Bold", 14)
    c.drawString(15 * mm, y, "ТЕСТОВЫЙ БАНК «ПРИМЕР»")
    y -= 9 * mm
    c.setFont("DejaVu", 11)
    c.drawString(15 * mm, y, "Квитанция об операции")
    y -= 12 * mm
    rows = [
        ("Операция", "Перевод по СБП"),
        ("Дата и время", "15.10.2026 14:30"),
        ("Статус", status),
        ("Сумма", "12 500,00 ₽"),
        ("Комиссия", "0,00 ₽"),
        ("Отправитель", "Анна А."),
        ("Счёт отправителя", "**** 1234"),
        ("Получатель", "ООО «Стройдвор»"),
        ("ИНН получателя", "7700000009"),
        ("Банк получателя", "Тестовый банк"),
        ("ID операции СБП", "A6288113000000000000000000000001"),
    ]
    for k, v in rows:
        c.setFont("DejaVu", 9)
        c.drawString(15 * mm, y, k)
        c.setFont("DejaVu-Bold" if k in ("Сумма", "Статус") else "DejaVu", 10)
        c.drawString(58 * mm, y, v)
        y -= 7.5 * mm
    y -= 6 * mm
    c.setFont("DejaVu", 7)
    c.drawString(15 * mm, y, f"Сформировано {created}. Тестовый документ, данные вымышлены.")
    c.save()


bank_pdf(ROOT / "pdf" / "bank-sbp-pending.pdf", "В обработке", "15.10.2026 14:30:40")
bank_pdf(ROOT / "pdf" / "bank-sbp-done.pdf", "Исполнен", "15.10.2026 14:35:02")

# ---------- scanned PDF: the «Исполнен» receipt as a picture, no text layer (R23) ----------
scan = Image.new("L", (1240, 1748), 250)
d = ImageDraw.Draw(scan)
f, fb = ImageFont.truetype(FONT, 30), ImageFont.truetype(FONT_B, 36)
d.text((90, 120), "ТЕСТОВЫЙ БАНК «ПРИМЕР»", font=fb, fill=20)
d.text((90, 190), "Квитанция об операции", font=f, fill=30)
y = 300
for k, v in [("Дата и время", "15.10.2026 14:30"), ("Статус", "Исполнен"), ("Сумма", "12 500,00 ₽"),
             ("Получатель", "ООО «Стройдвор»"), ("ИНН получателя", "7700000009")]:
    d.text((90, y), k, font=f, fill=60)
    d.text((520, y), v, font=fb, fill=15)
    y += 80
d.text((90, y + 60), "Тестовый документ, данные вымышлены.", font=f, fill=80)
scan = scan.rotate(0.8, fillcolor=250, resample=Image.BICUBIC).filter(ImageFilter.GaussianBlur(0.7))
scan.convert("RGB").save(ROOT / "pdf" / "scan-no-text.pdf", resolution=150, quality=80)

# ---------- 6 MB PDF for the 5 MB limit (NFR-D1, R32) ----------
noise = Image.frombytes("RGB", (2400, 2200), random.randbytes(2400 * 2200 * 3))  # ~6.2 MB as JPEG
buf = io.BytesIO()
noise.save(buf, "PDF", resolution=72, quality=95)
(ROOT / "pdf" / "oversize-6mb.pdf").write_bytes(buf.getvalue())

# ---------- files that must be rejected (R30, R31) ----------
(ROOT / "bad" / "empty.pdf").write_bytes(b"")
(ROOT / "bad" / "svg-renamed.jpg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text y="9">not a photo</text></svg>\n')
(ROOT / "bad" / "html-renamed.pdf").write_text(
    "<!doctype html><html><body><p>not a PDF</p></body></html>\n")
print("fixtures written")
