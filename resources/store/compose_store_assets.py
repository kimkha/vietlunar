#!/usr/bin/env python3
"""Compose Chrome Web Store images from popup captures.

The two popup-*.png files next to this script are the only inputs. Both are element
screenshots taken from a browser against `python3 -m http.server 8888` in the repo root,
pointed at http://127.0.0.1:8888/src/popup.html:

    popup-month.png  selector .khung, with #holidays set to display:none
    popup-tet.png    selector .cot-lich, after clicking the Tet row in #holidays

Run: python3 resources/store/compose_store_assets.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

STORE = Path(__file__).resolve().parent
RESOURCES = STORE.parent

CANVAS = (1280, 800)
MARGIN = 80

PLUM = (46, 10, 42)
BERRY = (116, 20, 34)
NAVY = (24, 42, 62)
CREAM = (255, 248, 235)
APRICOT = (255, 206, 150)

SANS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"]
SANS_BOLD = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/System/Library/Fonts/Supplemental/Arial Bold.ttf"]


def font(size, bold=False):
    for path in SANS_BOLD if bold else SANS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("no Vietnamese-capable TTF found; install fonts-dejavu")


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r, g, b = (round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img


def rounded_card(img, radius=16, spread=22):
    card = img.convert("RGB")
    w, h = card.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)

    out = Image.new("RGBA", (w + spread * 2, h + spread * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (spread, spread + 6, spread + w, spread + h + 6), radius=radius, fill=(0, 0, 0, 90))
    out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    out.paste(card, (spread, spread), mask)
    return out


def fit(img, max_w, max_h):
    img = img.convert("RGBA")
    scale = min(max_w / img.width, max_h / img.height)
    return img.resize((round(img.width * scale), round(img.height * scale)),
                      Image.Resampling.LANCZOS)


def largest_fitting(draw, lines, width, sizes, bold=False):
    for size in sizes:
        face = font(size, bold)
        if all(draw.textlength(line, font=face) <= width for line in lines):
            return face
    return font(sizes[-1], bold)


def save_rgb(img, name):
    path = STORE / name
    # Chrome Web Store rejects screenshots carrying an alpha channel.
    img.convert("RGB").save(path, "PNG")
    print("wrote", path.name, img.size)


def brand_lockup(canvas, icon, x, y, mark=56, size=34):
    mark_img = icon.convert("RGBA").resize((mark, mark), Image.Resampling.LANCZOS)
    canvas.paste(mark_img, (x, y), mark_img)
    ImageDraw.Draw(canvas).text((x + mark + 18, y + mark // 2), "VietLunar",
                                font=font(size, bold=True), fill=CREAM, anchor="lm")


def make_screenshot(name, headline, bullets, popup, icon, top, bottom):
    canvas = gradient(CANVAS, top, bottom)
    draw = ImageDraw.Draw(canvas)

    card = fit(rounded_card(popup), 700, CANVAS[1] - 2 * MARGIN + 44)
    card_x = CANVAS[0] - MARGIN - card.width + 22
    canvas.paste(card, (card_x, (CANVAS[1] - card.height) // 2), card)

    column = card_x - MARGIN - 48
    brand_lockup(canvas, icon, MARGIN, 76)

    face = largest_fitting(draw, headline, column, [46, 42, 38, 34, 30], bold=True)
    body = largest_fitting(draw, bullets, column, [23, 21, 19, 17])
    headline_step, bullet_step = face.size + 12, body.size + 20
    block = len(headline) * headline_step + 26 + len(bullets) * bullet_step
    y = (CANVAS[1] - block) // 2

    for line in headline:
        draw.text((MARGIN, y), line, font=face, fill=CREAM)
        y += headline_step

    y += 26
    for line in bullets:
        draw.text((MARGIN, y), line, font=body, fill=APRICOT)
        y += bullet_step

    save_rgb(canvas, name)


def make_small_tile(name, icon):
    canvas = gradient((440, 280), PLUM, BERRY)
    mark = icon.convert("RGBA").resize((116, 116), Image.Resampling.LANCZOS)
    canvas.paste(mark, (34, 82), mark)
    draw = ImageDraw.Draw(canvas)
    draw.text((172, 118), "VietLunar", font=font(38, bold=True), fill=CREAM, anchor="lm")
    draw.text((172, 162), "Âm lịch Việt Nam", font=font(21), fill=APRICOT, anchor="lm")
    save_rgb(canvas, name)


def make_marquee(name, popup, icon):
    canvas = gradient((1400, 560), NAVY, BERRY)
    draw = ImageDraw.Draw(canvas)

    card = fit(rounded_card(popup), 700, 440)
    card_x = 1400 - 72 - card.width + 22
    canvas.paste(card, (card_x, (560 - card.height) // 2), card)

    mark = 84
    tagline = "Lịch âm và dương trên thanh công cụ Chrome"
    face = largest_fitting(draw, [tagline], card_x - 72 - 48, [28, 26, 24, 22])
    block = mark + 18 + face.size
    y = (560 - block) // 2
    brand_lockup(canvas, icon, 72, y, mark=mark, size=46)
    draw.text((72, y + mark + 18), tagline, font=face, fill=APRICOT)

    save_rgb(canvas, name)


def main():
    month = Image.open(STORE / "popup-month.png")
    tet = Image.open(STORE / "popup-tet.png")
    icon = Image.open(RESOURCES / "icon.png")

    make_screenshot(
        "screenshot-1280x800-month.png",
        ["Ngày dương và ngày âm", "trong cùng một bảng"],
        ["Mỗi ô có cả ngày dương lẫn ngày âm",
         "Chọn một ngày để xem can chi và tiết khí",
         "Giờ hoàng đạo cho từng ngày"],
        month, icon, PLUM, BERRY,
    )
    make_screenshot(
        "screenshot-1280x800-tet.png",
        ["Ngày lễ âm lịch sắp tới,", "kèm đếm ngược"],
        ["Tết và ngày lễ được tô màu trên lịch",
         "Bấm một dòng để nhảy tới tháng đó",
         "Chạy offline, không theo dõi, không quảng cáo"],
        tet, icon, NAVY, BERRY,
    )
    make_small_tile("small-tile-440x280.png", icon)
    make_marquee("marquee-1400x560.png", month, icon)


if __name__ == "__main__":
    main()
