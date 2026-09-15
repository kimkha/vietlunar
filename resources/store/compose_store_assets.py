#!/usr/bin/env python3
"""Compose Chrome Web Store images from popup screenshots (24-bit PNG, no alpha)."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent


def crop_content(path, pad=8):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()
    bg = px[0, 0]
    def is_bg(c):
        return all(abs(c[i] - bg[i]) < 12 for i in range(3))

    left, top, right, bottom = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if not is_bg(px[x, y]):
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w - 1, right + pad)
    bottom = min(h - 1, bottom + pad)
    return img.crop((left, top, right + 1, bottom + 1))


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_card(img, radius=18, shadow=18):
    card = img.convert("RGB")
    w, h = card.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    rounded = Image.new("RGB", (w, h), (255, 255, 255))
    rounded.paste(card, (0, 0), mask)

    canvas_w, canvas_h = w + shadow * 2, h + shadow * 2
    shadow_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_img)
    sdraw.rounded_rectangle(
        (shadow, shadow + 4, shadow + w, shadow + h + 4),
        radius=radius,
        fill=(0, 0, 0, 70),
    )
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(10))
    out = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    out.alpha_composite(shadow_img)
    out.paste(rounded, (shadow, shadow), mask)
    return out


def gradient(size, c1, c2):
    w, h = size
    img = Image.new("RGB", size, c1)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=color)
    return img


def fit_card(card, max_w, max_h):
    card = card.convert("RGBA")
    cw, ch = card.size
    scale = min(max_w / cw, max_h / ch)
    nw, nh = int(cw * scale), int(ch * scale)
    return card.resize((nw, nh), Image.Resampling.LANCZOS)


def save_rgb(img, path):
    img.convert("RGB").save(path, "PNG")
    print("wrote", path, img.size)


def make_screenshot(path, title, subtitle, popup, extra=None):
    canvas = gradient((1280, 800), (122, 22, 36), (28, 49, 68))
    draw = ImageDraw.Draw(canvas)
    draw.text((72, 56), title, font=font(46, bold=True), fill=(255, 248, 235))
    draw.text((72, 122), subtitle, font=font(24), fill=(255, 214, 170))

    card = rounded_card(popup)
    placed = fit_card(card, 760, 560)
    canvas.paste(placed, (72, 190), placed)

    if extra:
        extra_card = fit_card(rounded_card(extra, radius=22), 320, 320)
        canvas.paste(extra_card, (900, 240), extra_card)

    save_rgb(canvas, path)


def make_toolbar_shot(path, popup, day_icon):
    canvas = gradient((1280, 800), (28, 49, 68), (122, 22, 36))
    draw = ImageDraw.Draw(canvas)
    draw.text((72, 56), "Ngày âm trên thanh công cụ", font=font(42, bold=True), fill=(255, 248, 235))
    draw.text(
        (72, 118),
        "Icon toolbar hiện số ngày âm lịch. Click để mở lịch tháng.",
        font=font(22),
        fill=(255, 214, 170),
    )

    bar = Image.new("RGB", (1100, 72), (47, 49, 54))
    bdraw = ImageDraw.Draw(bar)
    bdraw.rounded_rectangle((0, 0, 1099, 71), radius=12, fill=(47, 49, 54))
    icon = day_icon.resize((36, 36), Image.Resampling.LANCZOS).convert("RGB")
    bar.paste(icon, (1040, 18))
    bdraw.text((24, 22), "Chrome", font=font(22, bold=True), fill=(232, 234, 237))
    canvas.paste(bar, (90, 190))

    card = fit_card(rounded_card(popup), 980, 460)
    canvas.paste(card, (150, 290), card)
    save_rgb(canvas, path)


def make_small_tile(path, icon):
    canvas = gradient((440, 280), (122, 22, 36), (28, 49, 68))
    draw = ImageDraw.Draw(canvas)
    mark = icon.convert("RGBA").resize((120, 120), Image.Resampling.LANCZOS)
    canvas.paste(mark, (28, 80), mark)
    draw.text((168, 88), "VietLunar", font=font(36, bold=True), fill=(255, 248, 235))
    draw.text((168, 142), "Âm lịch Việt Nam", font=font(20), fill=(255, 214, 170))
    save_rgb(canvas, path)


def make_marquee(path, popup, icon):
    canvas = gradient((1400, 560), (28, 49, 68), (122, 22, 36))
    draw = ImageDraw.Draw(canvas)
    mark = icon.convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
    canvas.paste(mark, (64, 64), mark)
    draw.text((180, 72), "VietLunar", font=font(52, bold=True), fill=(255, 248, 235))
    draw.text((180, 140), "Lịch âm — dương trên Chrome", font=font(26), fill=(255, 214, 170))
    card = fit_card(rounded_card(popup), 720, 360)
    canvas.paste(card, (60, 160), card)
    save_rgb(canvas, path)


def main():
    sept = crop_content(ROOT / "popup-2026-09.png")
    tet = crop_content(ROOT / "popup-tet-2026.png")
    icon = Image.open(REPO / "icon.png")
    day = Image.open(REPO / "icon" / "20.png")

    make_screenshot(
        ROOT / "screenshot-1280x800-month.png",
        "Lịch tháng âm & dương",
        "Xem ngày dương và ngày âm trong cùng một bảng.",
        sept,
    )
    make_screenshot(
        ROOT / "screenshot-1280x800-tet.png",
        "Tết và ngày đặc biệt",
        "Ngày 1/1 âm lịch được đánh dấu trên lịch tháng.",
        tet,
    )
    make_toolbar_shot(ROOT / "screenshot-1280x800-toolbar.png", sept, day)
    make_small_tile(ROOT / "small-tile-440x280.png", icon)
    make_marquee(ROOT / "marquee-1400x560.png", sept, icon)


if __name__ == "__main__":
    main()
