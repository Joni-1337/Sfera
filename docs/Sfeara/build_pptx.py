# -*- coding: utf-8 -*-
"""Build СФЕРА investor PowerPoint with charts + 3D visuals."""
from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import nsmap
from pptx.oxml import parse_xml
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUT = ROOT / "SFERA_Investor_Pitch.pptx"

# Widescreen 16:9
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(0x0B, 0x14, 0x18)
CARD = RGBColor(0x12, 0x20, 0x25)
CARD2 = RGBColor(0x18, 0x30, 0x38)
TEAL = RGBColor(0x2D, 0xD4, 0xBF)
TEAL_DIM = RGBColor(0x14, 0x78, 0x6B)
WHITE = RGBColor(0xE8, 0xF2, 0xEF)
MUTED = RGBColor(0x9B, 0xB5, 0xAD)
AMBER = RGBColor(0xF0, 0xB4, 0x5A)
ROSE = RGBColor(0xF0, 0x71, 0x67)
LINE = RGBColor(0x2A, 0x45, 0x4C)


def set_run(run, size=18, bold=False, color=WHITE, font="Manrope"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_bg(slide, color=BG):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_shape(slide, left, top, width, height, fill=CARD, line=None):
    shape = slide.shapes.add_shape(1, left, top, width, height)  # rectangle
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)
    # soft corners via adjustment if available
    try:
        shape.adjustments[0] = 0.08
    except Exception:
        pass
    return shape


def add_text(slide, left, top, width, height, text, size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT, font="Manrope"):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run(run, size=size, bold=bold, color=color, font=font)
    return box


def add_para(tf, text, size=14, bold=False, color=MUTED, space_before=6, font="Manrope"):
    p = tf.add_paragraph()
    p.space_before = Pt(space_before)
    run = p.add_run()
    run.text = text
    set_run(run, size=size, bold=bold, color=color, font=font)
    return p


def add_bullets(slide, left, top, width, height, items, size=15):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = 0
        p.space_before = Pt(4 if i else 0)
        run = p.add_run()
        run.text = "▸  " + item
        set_run(run, size=size, color=MUTED)
    return box


def add_footer(slide, page, total=16):
    add_text(
        slide,
        Inches(0.5),
        Inches(7.15),
        Inches(6),
        Inches(0.3),
        "СФЕРА  ·  Confidential investor deck",
        size=10,
        color=MUTED,
    )
    add_text(
        slide,
        Inches(11.5),
        Inches(7.15),
        Inches(1.4),
        Inches(0.3),
        f"{page} / {total}",
        size=10,
        color=MUTED,
        align=PP_ALIGN.RIGHT,
    )


def add_accent_bar(slide, left, top, width=Inches(0.9), height=Inches(0.08)):
    s = add_shape(slide, left, top, width, height, fill=TEAL)
    return s


def style_chart(chart):
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    plot = chart.plots[0]
    plot.has_data_labels = False
    # Try to color series
    try:
        colors = [TEAL, TEAL_DIM, AMBER]
        for idx, series in enumerate(chart.series):
            try:
                series.format.fill.solid()
                series.format.fill.fore_color.rgb = colors[idx % len(colors)]
            except Exception:
                pass
    except Exception:
        pass


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    total = 16
    page = 0

    def new():
        nonlocal page
        page += 1
        slide = prs.slides.add_slide(blank)
        add_bg(slide)
        return slide

    # ========== 1 TITLE ==========
    s = new()
    img = ASSETS / "pitch-hero-sphere.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(7.6), Inches(0.9), height=Inches(5.5))
    add_shape(s, Inches(0), Inches(0), Inches(0.12), SLIDE_H, fill=TEAL)
    add_text(s, Inches(0.7), Inches(1.3), Inches(7), Inches(0.4), "INVESTOR PITCH  ·  SEED / PRE-SEED", size=12, bold=True, color=TEAL)
    add_accent_bar(s, Inches(0.7), Inches(1.75))
    add_text(s, Inches(0.7), Inches(2.0), Inches(7), Inches(1.8), "СФЕРА", size=54, bold=True, color=WHITE, font="Georgia")
    add_text(
        s,
        Inches(0.7),
        Inches(3.5),
        Inches(7),
        Inches(1.4),
        "Операционная система\nподготовки к ЕГЭ",
        size=28,
        bold=True,
        color=TEAL,
        font="Georgia",
    )
    add_text(
        s,
        Inches(0.7),
        Inches(5.2),
        Inches(6.5),
        Inches(0.9),
        "Платит преподаватель · ученики бесплатно\nРусский сегодня → мультипредметная платформа завтра",
        size=15,
        color=MUTED,
    )
    add_footer(s, page, total)

    # ========== 2 HOOK ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.35), Inches(10), Inches(0.35), "ПОЧЕМУ СЕЙЧАС", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.7), Inches(12), Inches(0.8), "Рынок готов. Инструменты — нет.", size=32, bold=True, color=WHITE, font="Georgia")
    cards = [
        ("01", "Стабильный спрос", "ЕГЭ — ежегодный ритуал.\nРепетиторы ищут систему,\nа не ещё один PDF."),
        ("02", "Хаос операционки", "Excel + WhatsApp +\nчужие тесты = потерянные\nчасы и слепой прогресс."),
        ("03", "Платформенный клин", "СФЕРА.* уже заточена\nпод предметы. Русский —\nwedge в большую ОС."),
    ]
    for i, (n, t, b) in enumerate(cards):
        left = Inches(0.6 + i * 4.15)
        add_shape(s, left, Inches(2.0), Inches(3.9), Inches(4.2), fill=CARD)
        add_text(s, left + Inches(0.35), Inches(2.3), Inches(3.2), Inches(0.4), n, size=22, bold=True, color=TEAL)
        add_text(s, left + Inches(0.35), Inches(2.9), Inches(3.2), Inches(0.6), t, size=20, bold=True, color=WHITE)
        add_text(s, left + Inches(0.35), Inches(3.7), Inches(3.2), Inches(2), b, size=15, color=MUTED)
    add_footer(s, page, total)

    # ========== 3 PROBLEM VISUAL ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.35), Inches(10), Inches(0.35), "ПРОБЛЕМА", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.7), Inches(12), Inches(0.7), "От хаоса — к одной системе", size=30, bold=True, color=WHITE, font="Georgia")
    img = ASSETS / "pitch-chaos-to-order.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.6), Inches(1.6), width=Inches(12.1))
    add_footer(s, page, total)

    # ========== 4 SOLUTION ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "РЕШЕНИЕ СЕГОДНЯ · СФЕРА.РУС", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(12), Inches(0.6), "Живой продукт. Не слайд про мечту.", size=28, bold=True, color=WHITE, font="Georgia")
    feats = [
        ("Группы", "Ключи, учёт, архив"),
        ("Задания ЕГЭ", "Банк + Excel + автопроверка"),
        ("Аналитика", "Группа · ученик · CSV"),
        ("Словарь", "Темы + слово дня"),
        ("Биллинг", "1 990 ₽ · trial 3 дня"),
        ("Ценность", "Учитель платит · ученик $0"),
    ]
    for i, (t, b) in enumerate(feats):
        col, row = i % 3, i // 3
        left = Inches(0.6 + col * 4.15)
        top = Inches(1.5 + row * 2.4)
        add_shape(s, left, top, Inches(3.95), Inches(2.15), fill=CARD if i < 5 else CARD2)
        add_shape(s, left, top, Inches(0.12), Inches(2.15), fill=TEAL)
        add_text(s, left + Inches(0.4), top + Inches(0.45), Inches(3.3), Inches(0.5), t, size=20, bold=True, color=WHITE)
        add_text(s, left + Inches(0.4), top + Inches(1.1), Inches(3.3), Inches(0.7), b, size=15, color=MUTED)
    add_footer(s, page, total)

    # ========== 5 PLATFORM SCALE ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "МАСШТАБ", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(6.5), Inches(1.0), "Не сайт по русскому —\nОС для ЕГЭ", size=28, bold=True, color=WHITE, font="Georgia")
    add_bullets(
        s,
        Inches(0.6),
        Inches(2.0),
        Inches(5.8),
        Inches(4.2),
        [
            "Ядро: аккаунты, группы, биллинг, аналитика",
            "Слой роста: чат, рефералка, AI, родители",
            "Модули: Рус → Мат → Общ → История…",
            "Форматы: ЕГЭ · ОГЭ · 10 класс · School",
            "Playbook предмета копируется, ядро общее",
        ],
        size=16,
    )
    img = ASSETS / "pitch-platform-modules.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(6.5), Inches(1.5), width=Inches(6.3))
    add_footer(s, page, total)

    # ========== 6 GROWTH BY YEARS CHART ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.25), Inches(12), Inches(0.3), "ТОЧКИ РОСТА ПО ГОДАМ · СЦЕНАРИЙ PLATFORM", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.55), Inches(12), Inches(0.55), "От клина к платформе", size=28, bold=True, color=WHITE, font="Georgia")

    chart_data = CategoryChartData()
    chart_data.categories = ["2026 Y1", "2027 Y2", "2028 Y3"]
    chart_data.add_series("Платящие учителя", (140, 480, 900))
    chart_data.add_series("MRR, тыс. ₽", (287, 1060, 2200))

    chart = s.shapes.add_chart(
        XL_CHART_TYPE.COLUMN_CLUSTERED,
        Inches(0.5),
        Inches(1.3),
        Inches(7.8),
        Inches(5.3),
        chart_data,
    ).chart
    style_chart(chart)

    # Milestone cards
    miles = [
        ("Y1", "Чат · рефералка\nAI · PWA · Мат MVP", TEAL),
        ("Y2", "3 предмета\nSchool · MRR 1M+", AMBER),
        ("Y3", "ОС ЕГЭ\nbreak-even path", TEAL),
    ]
    for i, (y, t, c) in enumerate(miles):
        top = Inches(1.5 + i * 1.7)
        add_shape(s, Inches(8.6), top, Inches(4.2), Inches(1.5), fill=CARD)
        add_shape(s, Inches(8.6), top, Inches(0.12), Inches(1.5), fill=c)
        add_text(s, Inches(8.95), top + Inches(0.25), Inches(3.6), Inches(0.4), y, size=18, bold=True, color=c)
        add_text(s, Inches(8.95), top + Inches(0.7), Inches(3.6), Inches(0.7), t, size=13, color=MUTED)
    add_footer(s, page, total)

    # ========== 7 SCENARIO COMPARISON CHART ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.25), Inches(12), Inches(0.3), "ТРИ СЦЕНАРИЯ", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.55), Inches(12), Inches(0.55), "Куда можем вырасти к M24", size=28, bold=True, color=WHITE, font="Georgia")

    cd = CategoryChartData()
    cd.categories = ["Focus", "Platform ★", "Aggressive"]
    cd.add_series("Paid teachers M24", (220, 480, 1100))
    cd.add_series("MRR M24, тыс. ₽", (438, 1060, 2860))
    chart = s.shapes.add_chart(
        XL_CHART_TYPE.COLUMN_CLUSTERED,
        Inches(0.4),
        Inches(1.25),
        Inches(8.0),
        Inches(5.4),
        cd,
    ).chart
    style_chart(chart)

    add_shape(s, Inches(8.7), Inches(1.5), Inches(4.1), Inches(5.0), fill=CARD)
    add_text(s, Inches(9.0), Inches(1.8), Inches(3.6), Inches(0.5), "Рекомендация", size=14, bold=True, color=TEAL)
    add_text(s, Inches(9.0), Inches(2.3), Inches(3.6), Inches(1.0), "Platform", size=32, bold=True, color=WHITE, font="Georgia")
    add_bullets(
        s,
        Inches(9.0),
        Inches(3.4),
        Inches(3.5),
        Inches(2.8),
        [
            "Ask 5–8M ₽",
            "LTV ~31k ₽",
            "3 предмета к M24",
            "MRR ~1.06M ₽",
            "Aggressive — опцион",
        ],
        size=14,
    )
    add_footer(s, page, total)

    # ========== 8 LTV / UNIT ECON ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "UNIT ECONOMICS", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(12), Inches(0.55), "Экономика, которая масштабируется", size=28, bold=True, color=WHITE, font="Georgia")

    stats = [
        ("1 990 ₽", "ARPU сейчас"),
        ("~31 000 ₽", "LTV Platform"),
        ("6%", "Churn / мес"),
        ("85%", "Gross margin"),
        (">3×", "Цель LTV/CAC"),
        ("<3 мес", "Payback цель"),
    ]
    for i, (v, l) in enumerate(stats):
        col, row = i % 3, i // 3
        left = Inches(0.6 + col * 4.15)
        top = Inches(1.5 + row * 2.5)
        add_shape(s, left, top, Inches(3.95), Inches(2.2), fill=CARD)
        add_text(s, left + Inches(0.35), top + Inches(0.5), Inches(3.3), Inches(0.7), v, size=28, bold=True, color=TEAL)
        add_text(s, left + Inches(0.35), top + Inches(1.3), Inches(3.3), Inches(0.5), l, size=15, color=MUTED)
    add_footer(s, page, total)

    # ========== 9 CHAT ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "ФИЧА РОСТА #1", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(6), Inches(1.0), "Чат внутри\nплатформы", size=30, bold=True, color=WHITE, font="Georgia")
    add_bullets(
        s,
        Inches(0.6),
        Inches(2.0),
        Inches(5.8),
        Inches(4),
        [
            "Личный чат учитель ↔ ученик",
            "Групповой канал и объявления",
            "Треды прямо к заданию / тесту",
            "Файлы, статусы прочтения",
            "Цель: убить WhatsApp как 2-ю систему",
            "Метрика: возвраты ученика в кабинет ↑",
        ],
        size=16,
    )
    img = ASSETS / "pitch-chat-network.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(6.4), Inches(1.4), width=Inches(6.4))
    add_footer(s, page, total)

    # ========== 10 REFERRAL ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "ФИЧА РОСТА #2", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(7), Inches(1.0), "Реферальный\nдвигатель", size=30, bold=True, color=WHITE, font="Georgia")
    img = ASSETS / "pitch-referral-network.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(7.8), Inches(1.2), height=Inches(5.4))
    add_shape(s, Inches(0.6), Inches(2.0), Inches(6.8), Inches(4.4), fill=CARD)
    add_bullets(
        s,
        Inches(0.95),
        Inches(2.3),
        Inches(6.1),
        Inches(3.8),
        [
            "Teacher → Teacher — главный канал роста",
            "Двусторонний бонус после первой оплаты",
            "Антифрод: награда только за paid",
            "Дашборд: invites → trial → paid",
            "Ученик видит бренд → приводит своего репетитора",
            "CAC из рефералов цель: 1–3k ₽ vs performance 5–12k",
        ],
        size=15,
    )
    add_footer(s, page, total)

    # ========== 11 PRODUCT VISION + GROWTH IMG ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.25), Inches(12), Inches(0.3), "ПРОДУКТОВОЕ ВИДЕНИЕ", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.55), Inches(12), Inches(0.55), "Что цепляет и удерживает", size=28, bold=True, color=WHITE, font="Georgia")
    img = ASSETS / "pitch-growth-path.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(0.5), Inches(1.3), width=Inches(7.5))
    items = [
        ("AI-разбор", "Ошибки → объяснение → похожие задания"),
        ("Карта ЕГЭ", "Готовность по кодификатору"),
        ("Родители", "Read-only прогресс и PDF-отчёты"),
        ("School", "Мультиучитель · seats · админ"),
        ("PWA", "Ежедневный вход ученика с телефона"),
        ("UGC", "Методики сообщества учителей"),
    ]
    for i, (t, b) in enumerate(items):
        top = Inches(1.3 + i * 0.85)
        add_shape(s, Inches(8.3), top, Inches(4.5), Inches(0.75), fill=CARD)
        add_text(s, Inches(8.5), top + Inches(0.08), Inches(4.1), Inches(0.3), t, size=13, bold=True, color=TEAL)
        add_text(s, Inches(8.5), top + Inches(0.38), Inches(4.1), Inches(0.3), b, size=11, color=MUTED)
    add_footer(s, page, total)

    # ========== 12 ROADMAP TIMELINE ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "ROADMAP 24 МЕС", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(12), Inches(0.55), "Линия масштабирования", size=28, bold=True, color=WHITE, font="Georgia")

    # timeline line
    add_shape(s, Inches(0.8), Inches(2.35), Inches(11.7), Inches(0.06), fill=TEAL_DIM)
    phases = [
        ("P0", "0–3", "Чат\nРефералка", TEAL),
        ("P1", "3–9", "AI · PWA\nРодители", TEAL),
        ("P2", "6–12", "СФЕРА.Мат\nMVP", AMBER),
        ("P3", "12–18", "3-й предмет\nSchool", TEAL),
        ("P4", "18–24", "Партнёрства\nMRR 1M+", TEAL),
    ]
    for i, (p, t, d, c) in enumerate(phases):
        left = Inches(0.7 + i * 2.45)
        # dot
        oval = s.shapes.add_shape(9, left + Inches(0.85), Inches(2.2), Inches(0.35), Inches(0.35))
        oval.fill.solid()
        oval.fill.fore_color.rgb = c
        oval.line.fill.background()
        add_shape(s, left, Inches(2.9), Inches(2.25), Inches(3.5), fill=CARD)
        add_text(s, left + Inches(0.2), Inches(3.15), Inches(1.9), Inches(0.35), p, size=18, bold=True, color=c)
        add_text(s, left + Inches(0.2), Inches(3.55), Inches(1.9), Inches(0.3), t + " мес", size=12, color=MUTED)
        add_text(s, left + Inches(0.2), Inches(4.2), Inches(1.9), Inches(1.5), d, size=15, bold=True, color=WHITE)
    add_footer(s, page, total)

    # ========== 13 GTM ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "GO-TO-MARKET", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(12), Inches(0.55), "Учитель приводит учителя", size=28, bold=True, color=WHITE, font="Georgia")
    funnel = [
        ("01 Визит", "SEO · Telegram · сарафан"),
        ("02 Регистрация", "Trial 3 дня без карты"),
        ("03 Активация", "Группа + задание < 15 мин"),
        ("04 Paid", "Подписка 1 990 ₽"),
        ("05 Referral", "Инвайт коллеге → цикл"),
    ]
    for i, (t, b) in enumerate(funnel):
        left = Inches(0.5 + i * 2.5)
        h = Inches(3.8 - i * 0.15)
        top = Inches(1.8) + (Inches(3.8) - h) / 2
        add_shape(s, left, top, Inches(2.35), h, fill=CARD if i % 2 == 0 else CARD2)
        add_text(s, left + Inches(0.15), top + Inches(0.8), Inches(2.05), Inches(0.8), t, size=16, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
        add_text(s, left + Inches(0.15), top + Inches(1.8), Inches(2.05), Inches(1.2), b, size=13, color=MUTED, align=PP_ALIGN.CENTER)
    add_footer(s, page, total)

    # ========== 14 USE OF FUNDS + PIE-ish bars ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.25), Inches(12), Inches(0.3), "USE OF FUNDS · PLATFORM ~6M ₽", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.55), Inches(12), Inches(0.55), "Деньги = скорость масштаба", size=28, bold=True, color=WHITE, font="Georgia")

    cd = CategoryChartData()
    cd.categories = ["Product", "Контент", "Growth", "Ops", "Reserve"]
    cd.add_series("Млн ₽", (2.7, 1.2, 1.2, 0.6, 0.3))
    chart = s.shapes.add_chart(
        XL_CHART_TYPE.BAR_CLUSTERED,
        Inches(0.4),
        Inches(1.3),
        Inches(7.5),
        Inches(5.3),
        cd,
    ).chart
    style_chart(chart)
    chart.has_legend = False

    add_shape(s, Inches(8.3), Inches(1.5), Inches(4.5), Inches(5.0), fill=CARD)
    add_text(s, Inches(8.6), Inches(1.8), Inches(4), Inches(0.4), "За 12 месяцев", size=16, bold=True, color=TEAL)
    add_bullets(
        s,
        Inches(8.6),
        Inches(2.4),
        Inches(3.9),
        Inches(3.8),
        [
            "Чат и рефералка в проде",
            "AI-assist + PWA",
            "СФЕРА.Мат MVP",
            "Рост paid teachers",
            "Доказанный LTV/CAC",
            "Готовность к School",
        ],
        size=15,
    )
    add_footer(s, page, total)

    # ========== 15 TRACTION PLACEHOLDER ==========
    s = new()
    add_text(s, Inches(0.6), Inches(0.3), Inches(12), Inches(0.3), "ТРАКШН", size=12, bold=True, color=TEAL)
    add_text(s, Inches(0.6), Inches(0.6), Inches(12), Inches(0.55), "Цифры перед встречей", size=28, bold=True, color=WHITE, font="Georgia")
    placeholders = [
        ("— —", "Платящие учителя"),
        ("— —", "MRR"),
        ("— —", "Trial → Paid"),
        ("Live", "Продукт + ЮKassa"),
        ("СФЕРА.Рус", "Модуль в проде"),
        ("sferaege.ru", "Сайт"),
    ]
    for i, (v, l) in enumerate(placeholders):
        col, row = i % 3, i // 3
        left = Inches(0.6 + col * 4.15)
        top = Inches(1.6 + row * 2.4)
        add_shape(s, left, top, Inches(3.95), Inches(2.1), fill=CARD)
        add_text(s, left + Inches(0.3), top + Inches(0.5), Inches(3.3), Inches(0.6), v, size=26, bold=True, color=TEAL)
        add_text(s, left + Inches(0.3), top + Inches(1.25), Inches(3.3), Inches(0.4), l, size=14, color=MUTED)
    add_footer(s, page, total)

    # ========== 16 ASK / CLOSE ==========
    s = new()
    img = ASSETS / "pitch-hero-sphere.png"
    if img.exists():
        s.shapes.add_picture(str(img), Inches(8.2), Inches(1.2), height=Inches(5.0))
    add_shape(s, Inches(0), Inches(0), Inches(0.12), SLIDE_H, fill=TEAL)
    add_text(s, Inches(0.7), Inches(1.4), Inches(7.5), Inches(0.35), "THE ASK", size=12, bold=True, color=TEAL)
    add_text(
        s,
        Inches(0.7),
        Inches(1.9),
        Inches(7.5),
        Inches(1.8),
        "Строим стандарт\nцифрового кабинета\nподготовки к ЕГЭ",
        size=30,
        bold=True,
        color=WHITE,
        font="Georgia",
    )
    boxes = [
        ("5–8M ₽", "Ask · Platform"),
        ("12–18 мес", "Runway & milestones"),
        ("СФЕРА.*", "ОС ЕГЭ в России"),
    ]
    for i, (v, l) in enumerate(boxes):
        left = Inches(0.7 + i * 2.45)
        add_shape(s, left, Inches(4.4), Inches(2.3), Inches(1.7), fill=CARD)
        add_text(s, left + Inches(0.15), Inches(4.65), Inches(2.0), Inches(0.5), v, size=18, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
        add_text(s, left + Inches(0.15), Inches(5.3), Inches(2.0), Inches(0.5), l, size=12, color=MUTED, align=PP_ALIGN.CENTER)
    add_footer(s, page, total)

    prs.save(str(OUT))
    print(f"Saved: {OUT}")
    return OUT


if __name__ == "__main__":
    build()
