"""
Discord Server Setup Guide — PDF Generator
Generates a comprehensive setup guide using ReportLab.
"""

import os
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, NextPageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, Image, KeepTogether,
    HRFlowable, ListFlowable, ListItem
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfgen import canvas

# ============================================================
# Font Registration
# ============================================================

FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu/",
    "/usr/share/fonts/truetype/liberation/",
    "/usr/share/fonts/truetype/english/",
]

def register_fonts():
    """Register fonts with fallback."""
    # Try Liberation Sans (good for English with regular/bold/italic)
    try:
        pdfmetrics.registerFont(TTFont('LibSans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('LibSans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
        pdfmetrics.registerFont(TTFont('LibSans-Italic', '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf'))
        pdfmetrics.registerFont(TTFont('LibSans-BoldItalic', '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf'))
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily('LibSans', normal='LibSans', bold='LibSans-Bold',
                          italic='LibSans-Italic', boldItalic='LibSans-BoldItalic')
        return 'LibSans'
    except Exception as e:
        print(f"Warning: Could not register Liberation Sans: {e}")

    # Try DejaVu Sans
    try:
        pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVu-Italic', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVu-BoldItalic', '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf'))
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold',
                          italic='DejaVu-Italic', boldItalic='DejaVu-BoldItalic')
        return 'DejaVu'
    except Exception as e:
        print(f"Warning: Could not register DejaVu: {e}")
    return 'Helvetica'

def register_mono():
    """Register monospace font for code blocks."""
    try:
        pdfmetrics.registerFont(TTFont('LibMono', '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('LibMono-Bold', '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'))
        return 'LibMono'
    except Exception:
        pass
    try:
        pdfmetrics.registerFont(TTFont('DejaVuMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVuMono-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
        return 'DejaVuMono'
    except Exception:
        return 'Courier'

BODY_FONT = register_fonts()
BODY_FONT_BOLD = BODY_FONT + '-Bold'
BODY_FONT_ITALIC = BODY_FONT + '-Italic'
MONO_FONT = register_mono()
MONO_FONT_BOLD = MONO_FONT + '-Bold'

# ============================================================
# Color Palette (Discord-inspired)
# ============================================================

# Discord brand palette
C_BG_DARK = colors.HexColor('#1E1F22')        # Discord darkest
C_BG_DARKER = colors.HexColor('#111214')      # Almost black
C_BG_CARD = colors.HexColor('#2B2D31')        # Discord card
C_BG_INPUT = colors.HexColor('#1E1F22')
C_TEXT_PRIMARY = colors.HexColor('#F2F3F5')   # Discord text
C_TEXT_MUTED = colors.HexColor('#949BA4')     # Discord muted
C_TEXT_HEADER = colors.HexColor('#FFFFFF')

C_BLURPLE = colors.HexColor('#5865F2')        # Discord Blurple
C_BLURPLE_DARK = colors.HexColor('#4752C4')
C_GREEN = colors.HexColor('#57F287')          # Discord Green
C_YELLOW = colors.HexColor('#FEE75C')         # Discord Yellow
C_RED = colors.HexColor('#ED4245')            # Discord Red
C_FUCHSIA = colors.HexColor('#EB459E')        # Discord Fuchsia

C_TABLE_HEADER = C_BLURPLE
C_TABLE_ROW_ALT = colors.HexColor('#2B2D31')
C_TABLE_ROW = colors.HexColor('#313338')

# For light body pages, use light backgrounds for readability
C_PAGE_BG = colors.HexColor('#FFFFFF')
C_TEXT_BODY = colors.HexColor('#1E1F22')
C_TEXT_BODY_MUTED = colors.HexColor('#4E5058')
C_CODE_BG = colors.HexColor('#F6F8FA')
C_CODE_BORDER = colors.HexColor('#E1E4E8')
C_NOTE_BG = colors.HexColor('#EBF0FF')
C_NOTE_BORDER = colors.HexColor('#5865F2')
C_TIP_BG = colors.HexColor('#E8F8EE')
C_TIP_BORDER = colors.HexColor('#57F287')
C_WARN_BG = colors.HexColor('#FFF8E1')
C_WARN_BORDER = colors.HexColor('#FEE75C')

# ============================================================
# Paragraph Styles
# ============================================================

styles = getSampleStyleSheet()

def make_styles():
    """Create custom paragraph styles."""
    base = {
        'fontName': BODY_FONT,
        'fontSize': 10.5,
        'leading': 15,
        'textColor': C_TEXT_BODY,
        'alignment': TA_LEFT,
    }

    return {
        'cover_title': ParagraphStyle('cover_title', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 38,
            'leading': 44,
            'textColor': C_TEXT_HEADER,
            'alignment': TA_LEFT,
        }),
        'cover_subtitle': ParagraphStyle('cover_subtitle', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT,
            'fontSize': 16,
            'leading': 22,
            'textColor': colors.HexColor('#BABBBD'),
            'alignment': TA_LEFT,
        }),
        'cover_kicker': ParagraphStyle('cover_kicker', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 11,
            'leading': 14,
            'textColor': C_BLURPLE,
            'alignment': TA_LEFT,
        }),
        'cover_meta': ParagraphStyle('cover_meta', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT,
            'fontSize': 11,
            'leading': 16,
            'textColor': colors.HexColor('#949BA4'),
            'alignment': TA_LEFT,
        }),
        'h1': ParagraphStyle('h1', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 22,
            'leading': 28,
            'textColor': C_TEXT_BODY,
            'alignment': TA_LEFT,
            'spaceBefore': 18,
            'spaceAfter': 12,
        }),
        'h2': ParagraphStyle('h2', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 16,
            'leading': 22,
            'textColor': C_BLURPLE,
            'alignment': TA_LEFT,
            'spaceBefore': 14,
            'spaceAfter': 8,
        }),
        'h3': ParagraphStyle('h3', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 13,
            'leading': 18,
            'textColor': C_TEXT_BODY,
            'alignment': TA_LEFT,
            'spaceBefore': 10,
            'spaceAfter': 6,
        }),
        'body': ParagraphStyle('body', parent=styles['Normal'], **{
            **base,
            'fontSize': 10.5,
            'leading': 16,
            'alignment': TA_LEFT,
            'spaceAfter': 8,
        }),
        'body_justified': ParagraphStyle('body_justified', parent=styles['Normal'], **{
            **base,
            'fontSize': 10.5,
            'leading': 16,
            'alignment': TA_JUSTIFY,
            'spaceAfter': 8,
        }),
        'bullet': ParagraphStyle('bullet', parent=styles['Normal'], **{
            **base,
            'fontSize': 10.5,
            'leading': 16,
            'leftIndent': 18,
            'bulletIndent': 4,
            'spaceAfter': 4,
        }),
        'code': ParagraphStyle('code', parent=styles['Normal'], **{
            'fontName': MONO_FONT,
            'fontSize': 9,
            'leading': 13,
            'textColor': C_TEXT_BODY,
            'backColor': C_CODE_BG,
            'borderColor': C_CODE_BORDER,
            'borderWidth': 0.5,
            'borderPadding': 6,
            'leftIndent': 8,
            'rightIndent': 8,
            'spaceBefore': 6,
            'spaceAfter': 8,
        }),
        'note': ParagraphStyle('note', parent=styles['Normal'], **{
            **base,
            'fontSize': 10,
            'leading': 15,
            'backColor': C_NOTE_BG,
            'borderColor': C_NOTE_BORDER,
            'borderWidth': 0,
            'borderPadding': 8,
            'leftIndent': 6,
            'rightIndent': 6,
            'spaceBefore': 6,
            'spaceAfter': 8,
        }),
        'tip': ParagraphStyle('tip', parent=styles['Normal'], **{
            **base,
            'fontSize': 10,
            'leading': 15,
            'backColor': C_TIP_BG,
            'borderColor': C_TIP_BORDER,
            'borderWidth': 0,
            'borderPadding': 8,
            'leftIndent': 6,
            'rightIndent': 6,
            'spaceBefore': 6,
            'spaceAfter': 8,
        }),
        'table_cell': ParagraphStyle('table_cell', parent=styles['Normal'], **{
            **base,
            'fontSize': 9,
            'leading': 12,
            'alignment': TA_LEFT,
        }),
        'table_cell_center': ParagraphStyle('table_cell_center', parent=styles['Normal'], **{
            **base,
            'fontSize': 9,
            'leading': 12,
            'alignment': TA_CENTER,
        }),
        'table_header': ParagraphStyle('table_header', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 9.5,
            'leading': 12,
            'textColor': colors.white,
            'alignment': TA_LEFT,
        }),
        'toc_h1': ParagraphStyle('toc_h1', parent=styles['Normal'], **{
            **base,
            'fontName': BODY_FONT_BOLD,
            'fontSize': 11,
            'leading': 18,
            'textColor': C_TEXT_BODY,
            'leftIndent': 0,
            'spaceBefore': 4,
        }),
        'toc_h2': ParagraphStyle('toc_h2', parent=styles['Normal'], **{
            **base,
            'fontSize': 10,
            'leading': 14,
            'textColor': C_TEXT_BODY_MUTED,
            'leftIndent': 18,
        }),
    }

S = make_styles()

# ============================================================
# Page Templates
# ============================================================

PAGE_W, PAGE_H = A4
MARGIN_L = 2.0 * cm
MARGIN_R = 2.0 * cm
MARGIN_T = 2.0 * cm
MARGIN_B = 2.0 * cm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
CONTENT_H = PAGE_H - MARGIN_T - MARGIN_B


def cover_canvas(canv, doc):
    """Draw cover page background."""
    # Full dark background
    canv.setFillColor(C_BG_DARK)
    canv.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Top accent bar (blurple)
    canv.setFillColor(C_BLURPLE)
    canv.rect(0, PAGE_H - 8, PAGE_W, 8, fill=1, stroke=0)
    # Side accent (vertical blurple strip on the left)
    canv.setFillColor(C_BLURPLE)
    canv.rect(0, 0, 6, PAGE_H, fill=1, stroke=0)
    # Decorative circle bottom right
    canv.setFillColor(C_BG_CARD)
    canv.circle(PAGE_W - 60, 90, 50, fill=1, stroke=0)
    canv.setFillColor(C_BLURPLE)
    canv.circle(PAGE_W - 60, 90, 18, fill=1, stroke=0)
    # Subtle horizontal divider near middle
    canv.setStrokeColor(C_BLURPLE)
    canv.setLineWidth(2)
    canv.line(MARGIN_L, PAGE_H * 0.42, MARGIN_L + 80, PAGE_H * 0.42)
    # Footer line
    canv.setStrokeColor(colors.HexColor('#3A3C41'))
    canv.setLineWidth(0.5)
    canv.line(MARGIN_L, 80, PAGE_W - MARGIN_R, 80)
    # Footer text
    canv.setFillColor(C_TEXT_MUTED)
    canv.setFont(BODY_FONT, 9)
    canv.drawString(MARGIN_L, 60, "Prepared for Marketing Team Leaders")
    canv.drawRightString(PAGE_W - MARGIN_R, 60, datetime.now().strftime("%B %Y"))


def body_canvas(canv, doc):
    """Draw body page header/footer."""
    # Top header bar
    canv.setFillColor(C_BLURPLE)
    canv.rect(0, PAGE_H - 4, PAGE_W, 4, fill=1, stroke=0)
    # Header text (left)
    canv.setFillColor(C_TEXT_MUTED)
    canv.setFont(BODY_FONT, 8.5)
    canv.drawString(MARGIN_L, PAGE_H - 20, "Discord Server Setup Guide")
    canv.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 20, "Marketing Team Leader Edition")
    # Footer line
    canv.setStrokeColor(colors.HexColor('#E1E4E8'))
    canv.setLineWidth(0.5)
    canv.line(MARGIN_L, 40, PAGE_W - MARGIN_R, 40)
    # Footer text
    canv.setFillColor(C_TEXT_MUTED)
    canv.setFont(BODY_FONT, 8.5)
    canv.drawString(MARGIN_L, 25, "Discord Server Setup Guide")
    canv.drawRightString(PAGE_W - MARGIN_R, 25, f"Page {doc.page}")


# ============================================================
# TOC Setup
# ============================================================

class MyDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        self.allowSplitting = 1

    def afterFlowable(self, flowable):
        """Register TOC entries for h1/h2."""
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            text = flowable.getPlainText()
            if style_name == 'h1':
                self.notify('TOCEntry', (0, text, self.page))
            elif style_name == 'h2':
                self.notify('TOCEntry', (1, text, self.page))


# ============================================================
# Helper Builders
# ============================================================

def p(text, style='body'):
    """Create a paragraph."""
    return Paragraph(text, S[style])

def h1(text):
    return Paragraph(text, S['h1'])

def h2(text):
    return Paragraph(text, S['h2'])

def h3(text):
    return Paragraph(text, S['h3'])

def spacer(h=10):
    return Spacer(1, h)

def hr(color=C_BLURPLE, thickness=1):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceBefore=4, spaceAfter=8)

def code_block(text, language=""):
    """Create a code block."""
    # Replace < > & for XML
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    if language:
        text = f'<font color="#949BA4">{language}</font>\n{text}'
    return Paragraph(f'<pre>{text}</pre>', S['code'])

def note_box(text, kind='note'):
    """Create a colored note/tip/warning box."""
    style_map = {
        'note': ('NOTE', S['note'], C_NOTE_BORDER),
        'tip': ('TIP', S['tip'], C_TIP_BORDER),
    }
    label, style, border_color = style_map.get(kind, ('NOTE', S['note'], C_NOTE_BORDER))
    # border_color.hexval() returns "0xRRGGBB" — convert to "#RRGGBB"
    hex_str = '#' + border_color.hexval()[2:]
    inner = Paragraph(f'<b><font color="{hex_str}">{label}</font></b> &nbsp; {text}', style)
    return inner

def make_table(data, col_widths=None, header=True, alt_rows=True):
    """Create a styled table. data[0] is header row if header=True."""
    if col_widths is None:
        n = len(data[0])
        col_widths = [CONTENT_W / n] * n
    # Wrap text cells in Paragraphs for proper wrapping
    wrapped = []
    for i, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if isinstance(cell, str):
                if i == 0 and header:
                    wrapped_row.append(Paragraph(cell, S['table_header']))
                else:
                    wrapped_row.append(Paragraph(cell, S['table_cell']))
            else:
                wrapped_row.append(cell)
        wrapped.append(wrapped_row)
    t = Table(wrapped, colWidths=col_widths, repeatRows=1 if header else 0)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.HexColor('#E1E4E8')),
    ]
    if header:
        style_cmds.extend([
            ('BACKGROUND', (0, 0), (-1, 0), C_TABLE_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), BODY_FONT_BOLD),
            ('TOPPADDING', (0, 0), (-1, 0), 7),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ])
    if alt_rows:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F6F8FA')))
    t.setStyle(TableStyle(style_cmds))
    return t


# ============================================================
# Cover Page Content
# ============================================================

def build_cover():
    """Build cover page flowables."""
    flow = []
    # Top spacer to push content down
    flow.append(Spacer(1, 6 * cm))
    # Kicker
    flow.append(Paragraph("TEAM MANAGEMENT PLAYBOOK", S['cover_kicker']))
    flow.append(Spacer(1, 0.6 * cm))
    # Title
    flow.append(Paragraph("Discord Server<br/>Setup Guide", S['cover_title']))
    flow.append(Spacer(1, 0.4 * cm))
    # Subtitle
    flow.append(Paragraph(
        "Complete setup manual for marketing team leaders —<br/>"
        "server architecture, custom bot, daily workflows, and<br/>"
        "performance tracking in one comprehensive guide.",
        S['cover_subtitle']
    ))
    flow.append(Spacer(1, 3 * cm))
    # Meta block
    flow.append(Paragraph(
        '<font color="#949BA4">PREPARED FOR</font><br/>'
        '<font color="#FFFFFF"><b>Marketing Team Leaders</b></font><br/><br/>'
        '<font color="#949BA4">EDITION</font><br/>'
        '<font color="#FFFFFF"><b>v1.0 — July 2026</b></font><br/><br/>'
        '<font color="#949BA4">SCOPE</font><br/>'
        '<font color="#FFFFFF"><b>Server Setup + Custom Bot + Workflows</b></font>',
        S['cover_meta']
    ))
    flow.append(NextPageTemplate('body'))
    flow.append(PageBreak())
    return flow


# ============================================================
# TOC Page
# ============================================================

def build_toc():
    """Build table of contents."""
    flow = []
    flow.append(h1("Table of Contents"))
    flow.append(hr())
    toc = TableOfContents()
    toc.levelStyles = [S['toc_h1'], S['toc_h2']]
    flow.append(toc)
    flow.append(PageBreak())
    return flow


# ============================================================
# Chapter Content
# ============================================================

def chapter_1():
    flow = []
    flow.append(h1("Chapter 1: Introduction & Overview"))

    flow.append(h2("1.1 Purpose of This Guide"))
    flow.append(p(
        "This guide walks you through the complete process of setting up a Discord server "
        "tailored for marketing team leaders who need to monitor team members, assign daily tasks, "
        "track attendance, collect end-of-day reports, and evaluate performance. Rather than relying "
        "on scattered tools across multiple platforms, Discord provides a single centralized hub where "
        "your team can communicate, collaborate, and stay accountable — all in real time.",
        'body_justified'
    ))
    flow.append(p(
        "The guide is designed for teams of six to fifteen members, which is the sweet spot for "
        "Discord-based collaboration: large enough to need structure and clear channels, but small "
        "enough that a single Team Leader can actively monitor everyone. We will use a mixed "
        "organizational structure that combines functional departments (social media, content, SEO, "
        "paid ads, email) with project-based channels, giving you the flexibility to spin up new "
        "project channels without disrupting the department-based workflows.",
        'body_justified'
    ))

    flow.append(h2("1.2 What You Will Build"))
    flow.append(p(
        "By the end of this guide, you will have a fully functional Discord server with a custom "
        "Python bot that automates the most repetitive parts of team leadership. The system includes:"
    ))
    items = [
        "<b>Server architecture</b> — nine categories with twenty-plus channels, organized by purpose (information, attendance, tasks, departments, projects, reports, performance, meetings, leader-only).",
        "<b>Roles and permissions</b> — five-tier hierarchy (Team Leader, Senior Marketer, Specialist, Junior, Guest) with channel-level permission overrides.",
        "<b>Custom Discord bot</b> — a Python bot with slash commands for check-in/check-out, task management, daily reports, meeting scheduling, performance tracking, and knowledge base tagging.",
        "<b>Automated reminders</b> — morning check-in reminder, end-of-day report reminder, and auto-generated weekly summary every Friday.",
        "<b>Gamified performance system</b> — points awarded for punctual check-ins, task completion (with bonus for early completion), report submissions, meeting attendance, and peer kudos.",
        "<b>Daily workflow playbook</b> — a recommended cadence for standups, task assignment, progress check-ins, and end-of-day reports that keeps the team aligned without micromanaging.",
    ]
    for it in items:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h2("1.3 Who Should Use This Guide"))
    flow.append(p(
        "This guide assumes you are already a Discord user (you have a Discord account and know how "
        "to create a server), but it does not assume any programming experience. The bot setup "
        "section walks through every step in detail, from creating a bot application on the Discord "
        "Developer Portal to installing Python dependencies and running the bot for the first time. "
        "If you can install software and edit a JSON file, you can deploy this bot.",
        'body_justified'
    ))
    flow.append(p(
        "The guide is specifically written for marketing teams, but the architecture and bot "
        "translate directly to any team-based knowledge work: development teams, customer support "
        "teams, design agencies, content studios, and operations teams can all use the same setup "
        "with minor renaming of channels and roles.",
        'body_justified'
    ))

    flow.append(h2("1.4 Expected Outcomes"))
    flow.append(p(
        "Teams that adopt this system typically see three improvements within the first month. "
        "First, attendance and punctuality improve because the daily check-in becomes a visible, "
        "gamified ritual — members earn points for being on time and lose the bonus for being late. "
        "Second, task visibility improves dramatically because every task is posted publicly in the "
        "#task-assignments channel with the assignee tagged, the deadline visible, and the priority "
        "color-coded. Third, daily reports become a habit rather than a chore because the bot "
        "reminds members at 17:00 and the structured fields (completed, in-progress, blockers, "
        "tomorrow) take only two minutes to fill out.",
        'body_justified'
    ))
    flow.append(p(
        "As a Team Leader, you gain a single dashboard (the #attendance-logs, #task-progress, and "
        "#daily-reports channels) where you can scan the entire team's day in under five minutes. "
        "The weekly summary that posts automatically every Friday afternoon gives you a quantitative "
        "view of who delivered what, which feeds directly into your one-on-one reviews and sprint "
        "retrospectives.",
        'body_justified'
    ))

    return flow


def chapter_2():
    flow = []
    flow.append(h1("Chapter 2: Server Architecture Blueprint"))

    flow.append(h2("2.1 The Mixed Organizational Model"))
    flow.append(p(
        "Pure functional structures (one channel per department) work well for stable teams, but "
        "marketing teams frequently form cross-functional project squads that pull members from "
        "multiple departments. Pure project-based structures, on the other hand, fragment department "
        "knowledge and make it hard to maintain shared standards. The mixed model used in this guide "
        "solves both problems by maintaining five permanent department channels for ongoing "
        "discussions and adding project channels on demand for time-bound campaigns.",
        'body_justified'
    ))
    flow.append(p(
        "When a new campaign launches — say, a Q4 holiday push that involves social media, paid ads, "
        "and email marketing — you create a #project-holiday-q4 channel. Members from all three "
        "departments join that channel for the duration of the campaign. Once the campaign concludes, "
        "you archive the channel. Department channels remain stable and serve as the long-term home "
        "for discipline-specific discussions, templates, and questions.",
        'body_justified'
    ))

    flow.append(h2("2.2 Category Map"))
    flow.append(p(
        "The table below lists every category and channel in the recommended server layout. Create "
        "them in this exact order — Discord sorts categories alphabetically by default, but you can "
        "drag them into any order once created. The order shown here places the most-frequently-used "
        "categories (information, attendance, tasks) at the top and the least-frequently-used "
        "(meetings, leader-only) at the bottom."
    ))

    arch_data = [
        ["#", "Category", "Channel", "Type", "Purpose"],
        ["1", "INFORMATION", "#announcements", "text", "Team-wide announcements, scheduled meetings"],
        ["", "HUB", "#rules", "text", "Server rules and expectations"],
        ["", "", "#team-info", "text", "Team roster, time zones, contacts"],
        ["", "", "#knowledge-base", "text", "Tagged playbooks, templates"],
        ["2", "ATTENDANCE", "#check-in", "text", "Bot posts morning reminders here"],
        ["", "", "#attendance-logs", "text", "Auto-logged check-in/check-out"],
        ["3", "TASK", "#task-assignments", "text", "New tasks posted by bot"],
        ["", "MANAGEMENT", "#task-progress", "text", "Discuss ongoing task progress"],
        ["", "", "#completed-tasks", "text", "Auto-logged completed tasks"],
        ["4", "MARKETING", "#social-media", "text", "Social media discussions"],
        ["", "DEPARTMENTS", "#content-creation", "text", "Blog, video, design content"],
        ["", "", "#seo-analytics", "text", "SEO and analytics"],
        ["", "", "#paid-ads", "text", "Paid advertising campaigns"],
        ["", "", "#email-marketing", "text", "Email campaigns and automation"],
        ["5", "PROJECTS", "#project-alpha", "text", "Specific project discussions"],
        ["", "", "#project-beta", "text", "Add more as needed"],
        ["6", "REPORTS", "#daily-reports", "text", "Auto-posted daily reports"],
        ["", "", "#weekly-summary", "text", "Auto-posted weekly summaries"],
        ["7", "PERFORMANCE", "#leaderboard", "text", "Weekly leaderboard posts"],
        ["", "", "#kudos", "text", "Peer recognition"],
        ["8", "MEETINGS", "#meeting-notes", "text", "Shared meeting notes"],
        ["", "", "Meeting Room", "voice", "Daily standups, team meetings"],
        ["", "", "Break Room", "voice", "Casual voice chat"],
        ["9", "TEAM LEADER", "#tl-private", "text", "TL-only private discussions"],
        ["", "", "#tl-decisions", "text", "TL-only decision log"],
    ]
    flow.append(make_table(arch_data, col_widths=[0.8*cm, 3.0*cm, 4.0*cm, 1.5*cm, 7.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("2.3 Channel Naming Conventions"))
    flow.append(p(
        "Consistent naming makes the server scannable. Use lowercase kebab-case for all text "
        "channels (#task-assignments, not #TaskAssignments or #task_assignments). Use Title Case "
        "for voice channels since they represent named rooms (Meeting Room, Break Room). Prefix "
        "project channels with #project- so they group together in the sidebar and are easy to "
        "archive in bulk when a sprint ends.",
        'body_justified'
    ))
    flow.append(p(
        "Avoid emoji in channel names during the initial setup — they look playful but they make "
        "channel references harder to type and parse. Once the team is comfortable with the layout, "
        "you can add a single leading emoji to each category (e.g., 📋 for INFORMATION, ⏰ for "
        "ATTENDANCE) to aid visual scanning.",
        'body_justified'
    ))

    flow.append(h2("2.4 Voice Channels Strategy"))
    flow.append(p(
        "Two voice channels are enough for a team of fifteen. The Meeting Room is the formal space "
        "for daily standups, weekly team meetings, and project reviews. The Break Room is the casual "
        "space where members can hang out, co-work silently, or pair on a task. If your team grows "
        "beyond fifteen, add a third channel called Focus Room for silent deep-work sessions, and "
        "consider adding project-specific voice channels under the PROJECTS category.",
        'body_justified'
    ))

    return flow


def chapter_3():
    flow = []
    flow.append(h1("Chapter 3: Roles & Permissions System"))

    flow.append(h2("3.1 The Five-Tier Hierarchy"))
    flow.append(p(
        "Discord permissions are role-based, and roles stack — a member with two roles gets the "
        "union of their permissions. To keep things simple, this guide uses five non-overlapping "
        "roles arranged in a strict hierarchy. The hierarchy matters because Discord only lets a "
        "role manage roles below it in the list, which prevents Junior Marketers from promoting "
        "themselves or demoting peers.",
        'body_justified'
    ))

    roles_data = [
        ["Role", "Color", "Who", "Key Permissions"],
        ["Team Leader", "Blurple", "You + deputies", "Administrator (full access), manage roles, manage channels, use all bot commands"],
        ["Senior Marketer", "Green", "Experienced members", "Manage messages, add KB entries, mute members, assign tasks via bot"],
        ["Marketing Specialist", "Yellow", "Standard members", "Send messages, use slash commands, voice chat, read all channels"],
        ["Junior Marketer", "Grey", "New hires (first 30 days)", "Send messages in most channels, read-only in #knowledge-base"],
        ["Guest", "Fuchsia", "Clients, observers", "Read-only access to #announcements and #team-info only"],
    ]
    flow.append(make_table(roles_data, col_widths=[3.5*cm, 2.0*cm, 4.0*cm, 7.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("3.2 Permissions Matrix by Category"))
    flow.append(p(
        "The matrix below shows which roles can do what in each category. Cells marked with a "
        "checkmark indicate the default permission; permission overrides on individual channels can "
        "narrow these further. The Team Leader column is omitted because the Team Leader role has "
        "Administrator permission and can do everything everywhere."
    ))

    perm_data = [
        ["Category", "Senior", "Specialist", "Junior", "Guest"],
        ["INFORMATION", "Read + Post", "Read + Post", "Read", "Read announcements only"],
        ["ATTENDANCE", "Read + Post", "Read + Post", "Read + Post", "No access"],
        ["TASK MANAGEMENT", "Read + Post + Assign", "Read + Post", "Read + Post", "No access"],
        ["MARKETING DEPARTMENTS", "Read + Post", "Read + Post", "Read + Post", "No access"],
        ["PROJECTS", "Read + Post", "Read + Post", "Read + Post", "Per project"],
        ["REPORTS", "Read own + Post", "Read own + Post", "Read own + Post", "No access"],
        ["PERFORMANCE", "Read", "Read", "Read", "No access"],
        ["MEETINGS", "Read + Post + Voice", "Read + Post + Voice", "Read + Post + Voice", "No access"],
        ["TEAM LEADER", "No access", "No access", "No access", "No access"],
    ]
    flow.append(make_table(perm_data, col_widths=[4.0*cm, 3.0*cm, 3.0*cm, 3.0*cm, 4.0*cm]))
    flow.append(spacer(8))

    flow.append(h2("3.3 Setting Up Channel-Level Permission Overrides"))
    flow.append(p(
        "Category-level permissions cascade to all channels in that category, but you can override "
        "them on individual channels. The most important override is on the #tl-private and "
        "#tl-decisions channels in the TEAM LEADER category: these channels must be invisible to "
        "everyone except Team Leaders. To set this up:"
    ))
    steps = [
        "Right-click the channel → Edit Channel.",
        "Go to the Permissions tab.",
        "Click the + button next to \"Roles / Members\" and add @everyone.",
        "Set \"View Channel\" to the red X (deny) for @everyone.",
        "Click the + button again and add the Team Leader role.",
        "Set \"View Channel\" to the green check (allow) for Team Leader.",
        "Repeat for #tl-decisions.",
    ]
    for i, step in enumerate(steps, 1):
        flow.append(Paragraph(f"<b>{i}.</b> {step}", S['bullet']))
    flow.append(spacer(8))

    flow.append(note_box(
        "Permission overrides are additive for allows and subtractive for denies. If @everyone is "
        "denied View Channel but a member's other role grants View Channel category-wide, the "
        "channel-level deny wins. Always test by switching to a test account or asking a Junior "
        "Marketer to verify they cannot see the private channel.",
        'note'
    ))

    flow.append(h2("3.4 Role Colors and Visual Identity"))
    flow.append(p(
        "Role colors serve as visual cues in the member sidebar and message author tags. Use the "
        "Discord brand palette for consistency: Blurple (#5865F2) for Team Leaders, Green (#57F287) "
        "for Senior Marketers, Yellow (#FEE75C) for Specialists, Grey (#949BA4) for Juniors, and "
        "Fuchsia (#EB459E) for Guests. Set \"Display role members separately from other online "
        "members\" to ON for the Team Leader role so they appear at the top of the member list — "
        "this makes it easy for team members to find you when they need help.",
        'body_justified'
    ))

    return flow


def chapter_4():
    flow = []
    flow.append(h1("Chapter 4: Category-by-Category Setup"))

    flow.append(p(
        "This chapter walks through each category in detail, explaining the purpose of every channel, "
        "the recommended topic text (shown when members hover over the channel name), and any "
        "permission overrides you should apply. Create categories in the order presented here — "
        "Discord lets you reorder them by dragging later, but creating them in order saves time.",
        'body_justified'
    ))

    flow.append(h2("4.1 Information Hub"))
    flow.append(p(
        "This category is the team's reference layer. Members visit it on day one to learn the rules "
        "and return to it whenever they need to find a documented procedure. All channels here are "
        "read-only for everyone except Team Leaders and Senior Marketers, which keeps the content "
        "authoritative and prevents well-meaning members from editing pinned templates."
    ))
    flow.append(h3("#announcements"))
    flow.append(p(
        "Purpose: broadcast important updates to the entire team — scheduled meetings, deadline "
        "reminders, organizational changes, wins worth celebrating. The bot also posts scheduled "
        "meeting summaries here automatically. Recommended topic: \"Team-wide announcements. Read "
        "only. Use @here for time-sensitive items, @everyone only for true emergencies.\"",
        'body_justified'
    ))
    flow.append(h3("#rules"))
    flow.append(p(
        "Purpose: codify the team's working agreement. Pin a single message containing the rules: "
        "expected response time during working hours, daily check-in deadline, daily report deadline, "
        "code of conduct, escalation path for blockers, and confidentiality expectations. Recommended "
        "topic: \"Server rules and team working agreement. Read on day one, refer back when in doubt.\"",
        'body_justified'
    ))
    flow.append(h3("#team-info"))
    flow.append(p(
        "Purpose: living roster with each member's name, role, time zone, primary contact method, "
        "and areas of expertise. Pin a table-formatted message and update it whenever the team "
        "changes. Recommended topic: \"Who's who on the team. Time zones, contact methods, "
        "specialties.\"",
        'body_justified'
    ))
    flow.append(h3("#knowledge-base"))
    flow.append(p(
        "Purpose: searchable repository of marketing playbooks, brand guidelines, campaign templates, "
        "tool tutorials, and case studies. Use the bot's /kb-add command to post entries with "
        "category tags (Playbook, Template, Brand Guide, Tool Tutorial, Case Study, FAQ). Members "
        "can search by typing keywords into the channel search bar. Recommended topic: \"Tagged KB "
        "entries. Use /kb-add to contribute. Search by tag: [Playbook], [Template], etc.\"",
        'body_justified'
    ))

    flow.append(h2("4.2 Attendance"))
    flow.append(p(
        "This category hosts the daily check-in ritual. Members run /checkin when they start work "
        "and /checkout when they finish. The bot logs each event to #attendance-logs with the "
        "member's name, time, status (on time or late), and points earned. As Team Leader, you can "
        "run /attendance at any time to see who has and has not checked in today.",
        'body_justified'
    ))
    flow.append(h3("#check-in"))
    flow.append(p(
        "Purpose: the channel where the bot posts the morning check-in reminder at 09:00 and where "
        "members can post informal \"good morning\" messages. The actual /checkin command can be run "
        "from any channel — the bot will respond in the channel where the command was issued, but "
        "the log goes to #attendance-logs regardless. Recommended topic: \"Daily check-in channel. "
        "Bot posts 09:00 reminder. Run /checkin anywhere.\"",
        'body_justified'
    ))
    flow.append(h3("#attendance-logs"))
    flow.append(p(
        "Purpose: bot-only channel that records every check-in and check-out event as an embed. "
        "Members can read this channel to see who is online, but only Team Leaders can post in it "
        "(the bot bypasses this restriction because it has Manage Messages permission). Recommended "
        "topic: \"Auto-logged attendance. Read-only for members. Use /attendance for the summary view.\"",
        'body_justified'
    ))

    flow.append(h2("4.3 Task Management"))
    flow.append(p(
        "This category is the operational core of the server. Every task the team works on is "
        "tracked here from creation through completion. The bot's task commands (/task-create, "
        "/task-assign, /task-complete, /task-list) integrate with these channels to keep a permanent, "
        "searchable record of all work.",
        'body_justified'
    ))
    flow.append(h3("#task-assignments"))
    flow.append(p(
        "Purpose: bot posts every newly-created task here as a color-coded embed (color reflects "
        "priority: blue for medium, yellow for high, red for urgent). The assignee is tagged in the "
        "message so they get an instant notification. Recommended topic: \"New tasks appear here. "
        "Bot tags assignees automatically. Discuss progress in #task-progress.\"",
        'body_justified'
    ))
    flow.append(h3("#task-progress"))
    flow.append(p(
        "Purpose: free-form discussion channel where members post updates, ask for help, and "
        "share screenshots or links related to in-progress tasks. This is the day-to-day "
        "conversation channel for active work. Recommended topic: \"Discuss active tasks. Share "
        "screenshots, ask questions, coordinate handoffs.\"",
        'body_justified'
    ))
    flow.append(h3("#completed-tasks"))
    flow.append(p(
        "Purpose: bot posts every completed task here with the assignee's avatar, completion time, "
        "and points earned. Use this channel for the Friday wrap-up — scroll through the week's "
        "completions to celebrate wins and identify patterns. Recommended topic: \"Auto-logged "
        "completed tasks. Use for weekly review and celebrations.\"",
        'body_justified'
    ))

    flow.append(h2("4.4 Marketing Departments"))
    flow.append(p(
        "These five channels are the permanent homes for discipline-specific conversations. Members "
        "tend to live primarily in their department channel and visit project channels only when "
        "their work crosses over. Each channel should have at least one pinned message containing "
        "the department's working norms, key tools, and current focus areas.",
        'body_justified'
    ))
    flow.append(p(
        "If your team has different departments (e.g., PR, Events, Partnership), rename the "
        "channels accordingly — the structure scales. Avoid creating more than seven department "
        "channels; beyond that, the sidebar becomes cluttered and members start missing messages. "
        "If a department is small (one or two members), fold it into a related department rather "
        "than giving it its own channel.",
        'body_justified'
    ))

    flow.append(h2("4.5 Projects"))
    flow.append(p(
        "Project channels are temporary — they exist for the duration of a campaign and are then "
        "archived. Naming convention: #project-<campaign-name> (e.g., #project-summer-launch, "
        "#project-black-friday). When a project ends, right-click the channel → Edit Channel → "
        "Archive Channel. Archived channels disappear from the sidebar but remain searchable, which "
        "preserves institutional knowledge without cluttering the active view.",
        'body_justified'
    ))
    flow.append(p(
        "Resist the temptation to give every cross-team conversation its own project channel. A "
        "good rule of thumb: only create a project channel when the work will span at least one "
        "week and involve at least three members from two or more departments. For shorter or "
        "smaller collaborations, use a thread inside the relevant department channel.",
        'body_justified'
    ))

    flow.append(h2("4.6 Reports"))
    flow.append(p(
        "These two channels capture the team's daily and weekly cadence. The #daily-reports channel "
        "is bot-driven: every time a member runs /report-submit, the bot formats their input into a "
        "structured embed and posts it here. The #weekly-summary channel receives the auto-generated "
        "Friday afternoon summary, which lists the week's top performers, total tasks completed, "
        "and tasks still open.",
        'body_justified'
    ))
    flow.append(p(
        "Make #daily-reports the first channel you check each morning and the last you check each "
        "evening. It gives you a complete picture of what the team delivered yesterday and what "
        "they plan to deliver tomorrow, in their own words. Reading these reports carefully is "
        "the single highest-leverage activity you can do as a Team Leader.",
        'body_justified'
    ))

    flow.append(h2("4.7 Performance"))
    flow.append(p(
        "The #leaderboard and #kudos channels are the gamification layer. The bot posts the weekly "
        "leaderboard to #weekly-summary every Friday, but you can also pin a manually-refreshed "
        "leaderboard message in #leaderboard. The #kudos channel is for peer-to-peer recognition: "
        "any member can run /kudos @member \"reason\" to publicly thank a teammate, and the bot "
        "awards the recipient two bonus points.",
        'body_justified'
    ))
    flow.append(p(
        "Gamification works best when it is transparent and consistent. Never adjust points "
        "manually — if a member feels the system is unfair, address the underlying rule rather "
        "than patching individual scores. Review the points configuration in config.json quarterly "
        "and adjust based on what behaviors you want to encourage.",
        'body_justified'
    ))

    flow.append(h2("4.8 Meetings"))
    flow.append(p(
        "The Meetings category has one text channel (#meeting-notes) for shared notes and one or "
        "two voice channels for the actual meetings. During a meeting, one person (typically the "
        "Team Leader or a rotating note-taker) types key decisions, action items, and owners into "
        "#meeting-notes in real time. After the meeting, the note-taker formats the notes and pins "
        "them with a clear title (e.g., \"Weekly Standup — 2026-07-03\").",
        'body_justified'
    ))
    flow.append(p(
        "Use the bot's /meeting-schedule command to announce meetings in advance. The command posts "
        "a formatted embed to #announcements with the meeting title, type, time, duration, and "
        "agenda. Members who attend can run /meeting-attend to mark their presence and earn four "
        "points — this creates a soft incentive to show up on time.",
        'body_justified'
    ))

    flow.append(h2("4.9 Team Leader"))
    flow.append(p(
        "This private category is your space as Team Leader. Use #tl-private for sensitive "
        "discussions with deputies or HR partners, and #tl-decisions as a running log of "
        "significant decisions (role changes, performance concerns, strategy shifts). The decision "
        "log becomes invaluable during performance reviews and quarterly planning — it is hard to "
        "remember six months later why a particular call was made unless you wrote it down at the "
        "time.",
        'body_justified'
    ))
    flow.append(p(
        "These two channels must be invisible to everyone except Team Leaders. Configure the "
        "permission overrides as described in section 3.3, and verify the configuration by asking "
        "a non-leader member to confirm they cannot see the channels in their sidebar.",
        'body_justified'
    ))

    return flow


def chapter_5():
    flow = []
    flow.append(h1("Chapter 5: Custom Discord Bot Setup"))

    flow.append(h2("5.1 Why a Custom Bot?"))
    flow.append(p(
        "Off-the-shelf Discord bots like MEE6 and Carl-bot cover moderation and reaction roles, but "
        "they do not handle the team-management workflow you need: attendance tracking, task "
        "lifecycle, structured daily reports, performance points, and weekly summaries. A custom "
        "bot gives you complete control over the commands, the data format, and the points logic — "
        "and because the bot is yours, you can extend it with new commands as your workflow evolves.",
        'body_justified'
    ))
    flow.append(p(
        "The bot included with this guide is written in Python using discord.py 2.3+, the most "
        "widely-used Discord library. It uses slash commands (the modern command interface that "
        "Discord introduced in 2021), persists data to local JSON files (no database setup "
        "required), and includes a scheduled reminder system using APScheduler. The full source "
        "code is in bot.py — about 700 lines, well-commented, and easy to extend.",
        'body_justified'
    ))

    flow.append(h2("5.2 Prerequisites"))
    flow.append(p("Before you begin, make sure you have the following:"))
    prereqs = [
        "<b>Python 3.10 or newer</b> — verify with <font face='{mono}'>python --version</font>. Install from python.org if needed.",
        "<b>pip</b> — Python's package installer, comes bundled with Python.",
        "<b>A Discord account</b> with permission to manage the target server.",
        "<b>The bot source files</b> — bot.py, config.json, requirements.txt — delivered alongside this guide.",
        "<b>A text editor</b> — VS Code, Sublime, or even Notepad will work. You only need to edit config.json.",
    ]
    for it in prereqs:
        flow.append(Paragraph(f"• {it}".replace('{mono}', MONO_FONT), S['bullet']))
    flow.append(spacer(6))

    flow.append(h2("5.3 Step 1 — Create the Bot Application"))
    flow.append(p(
        "Open the Discord Developer Portal at discord.com/developers/applications and sign in with "
        "your Discord account. Click the \"New Application\" button in the top-right corner, name "
        "your application (e.g., \"Marketing Team Bot\"), and click Create. The application is the "
        "container for your bot; one application maps to one bot."
    ))
    flow.append(p(
        "Once the application is created, navigate to the Bot tab in the left sidebar and click "
        "\"Add Bot\". Confirm the prompt. You now have a bot user attached to your application. "
        "Scroll down to the Privileged Gateway Intents section and toggle ON both the Server "
        "Members Intent and the Message Content Intent — the bot needs these to read member "
        "information and (in some legacy commands) message content."
    ))
    flow.append(note_box(
        "Treat your bot token like a password. Anyone with the token can run any command as your "
        "bot. Never commit it to a public Git repository — the included .gitignore file already "
        "excludes config.json, but double-check before pushing.",
        'note'
    ))

    flow.append(h2("5.4 Step 2 — Invite the Bot to Your Server"))
    flow.append(p(
        "Stay in the Developer Portal and navigate to OAuth2 → URL Generator. Under Scopes, "
        "check the \"bot\" checkbox and the \"applications.commands\" checkbox. The first authorizes "
        "the bot to join your server; the second authorizes it to register slash commands. Under "
        "Bot Permissions, check the following:"
    ))
    perms = [
        "Manage Roles",
        "Read Messages / View Channels",
        "Send Messages",
        "Embed Links",
        "Read Message History",
        "Mention Everyone",
        "Add Reactions",
        "Use Slash Commands",
    ]
    for p_text in perms:
        flow.append(Paragraph(f"• {p_text}", S['bullet']))
    flow.append(spacer(6))
    flow.append(p(
        "Copy the generated URL at the bottom of the page and open it in a new browser tab. "
        "Discord will ask which server to add the bot to — select your team server and click "
        "Authorize. Solve the CAPTCHA and the bot will appear in your server's member list, "
        "offline for now (it will come online once you run the Python script)."
    ))

    flow.append(h2("5.5 Step 3 — Install Python Dependencies"))
    flow.append(p(
        "Open a terminal or command prompt in the folder where you placed the bot files. Create a "
        "virtual environment to keep dependencies isolated, then install the required packages:"
    ))
    flow.append(code_block(
        "# Create virtual environment\n"
        "python -m venv venv\n\n"
        "# Activate it\n"
        "# On macOS/Linux:\n"
        "source venv/bin/activate\n"
        "# On Windows:\n"
        "venv\\Scripts\\activate\n\n"
        "# Install dependencies\n"
        "pip install -r requirements.txt",
        "bash"
    ))

    flow.append(h2("5.6 Step 4 — Configure the Bot"))
    flow.append(p(
        "Open config.json in your text editor. The file has five sections: token, channels, roles, "
        "schedule, and points. Fill them in as follows:"
    ))
    flow.append(h3("Token"))
    flow.append(p(
        "Replace PUT_YOUR_BOT_TOKEN_HERE with the token you copied from the Developer Portal. "
        "Alternatively, set an environment variable named DISCORD_TOKEN and leave the token field "
        "in config.json as-is — the bot reads the env variable first."
    ))
    flow.append(h3("Guild ID"))
    flow.append(p(
        "Set guild_id to your server's ID. To find it, enable Developer Mode in Discord (Settings → "
        "Advanced → Developer Mode), then right-click your server name → Copy ID. Setting guild_id "
        "makes slash commands sync instantly to your server; without it, commands can take up to an "
        "hour to appear globally."
    ))
    flow.append(h3("Channel IDs"))
    flow.append(p(
        "Each channel listed in the channels section needs the actual channel ID from your server. "
        "Right-click each channel → Copy ID. If you did not create a particular channel yet, leave "
        "its value as 0 — the bot will skip posting to that channel without crashing."
    ))
    flow.append(h3("Role IDs"))
    flow.append(p(
        "Same process for roles. Right-click each role in the member list → Copy ID. The team_leader "
        "role ID is the most important — without it, the bot cannot tell who is allowed to use "
        "Team-Leader-only commands."
    ))
    flow.append(h3("Schedule"))
    flow.append(p(
        "Adjust the times in the schedule section to match your team's working hours. Times are in "
        "24-hour format and use the timezone specified in the timezone field (default: "
        "Africa/Algiers). The four key times are: morning_reminder (when the bot reminds members "
        "to check in), check_in_deadline (the cutoff for on-time vs. late), report_reminder (when "
        "the bot reminds members to submit their daily report), and report_deadline (the cutoff "
        "for the day)."
    ))
    flow.append(h3("Points"))
    flow.append(p(
        "The points section controls how many points each action awards. Defaults are balanced for "
        "a 40-hour work week: on-time check-in (2 pts × 5 days = 10), daily report (3 pts × 5 = "
        "15), one task per day (5 pts × 5 = 25), and meeting attendance (4 pts × 1 = 4) gives a "
        "typical active member about 54 points per week. Adjust the values if you want to "
        "emphasize different behaviors."
    ))

    flow.append(h2("5.7 Step 5 — Run the Bot"))
    flow.append(p(
        "With config.json filled in and dependencies installed, start the bot:"
    ))
    flow.append(code_block("python bot.py", "bash"))
    flow.append(p(
        "On a successful startup, you should see log output like this:"
    ))
    flow.append(code_block(
        "2026-07-03 09:00:00 | INFO     | team-bot | Logged in as Marketing Team Bot#1234\n"
        "2026-07-03 09:00:00 | INFO     | team-bot | Connected to 1 guild(s)\n"
        "2026-07-03 09:00:00 | INFO     | team-bot | Synced 16 slash commands to guild 123456789\n"
        "2026-07-03 09:00:00 | INFO     | team-bot | APScheduler started for fine-grained scheduling",
        "log"
    ))
    flow.append(p(
        "The bot is now online in your server. Type / in any channel to see the list of available "
        "commands. Try /checkin to verify attendance logging works, then /help to see the full "
        "command reference. The bot will continue running until you stop it with Ctrl+C."
    ))

    flow.append(h2("5.8 Keeping the Bot Running"))
    flow.append(p(
        "For day-to-day use, the bot should run continuously on a server rather than your laptop. "
        "The simplest option is a small cloud VM (DigitalOcean droplet, AWS EC2 t2.micro, or "
        "similar) running Linux. Copy the bot files to the VM, install Python and dependencies, "
        "and run the bot inside a terminal multiplexer like tmux or screen so it survives your SSH "
        "session disconnecting. For production deployments, consider using systemd to auto-restart "
        "the bot on crash or VM reboot — a sample systemd unit file is included in the README.",
        'body_justified'
    ))

    return flow


def chapter_6():
    flow = []
    flow.append(h1("Chapter 6: Bot Commands Reference"))

    flow.append(p(
        "The bot exposes sixteen slash commands organized into six functional groups. Every command "
        "is invoked by typing / followed by the command name in any channel where the bot can read "
        "and send messages. Most commands respond ephemerally (only the caller sees the response) "
        "to keep the channel clean; the bot simultaneously posts the permanent record (attendance "
        "log, task assignment, etc.) to the appropriate log channel.",
        'body_justified'
    ))

    flow.append(h2("6.1 Attendance Commands"))

    att_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/checkin", "All", "—", "Register daily check-in. Awards 2 pts on time, 1 pt late. Logs to #attendance-logs."],
        ["/checkout", "All", "—", "Register check-out. Records work duration. Logs to #attendance-logs."],
        ["/attendance", "TL", "member (optional)", "View today's attendance summary. Filter by member if provided."],
    ]
    flow.append(make_table(att_data, col_widths=[3.0*cm, 1.5*cm, 4.0*cm, 8.5*cm]))
    flow.append(spacer(8))

    flow.append(h3("Example: /checkin"))
    flow.append(p("Run /checkin in any channel. The bot responds privately:"))
    flow.append(code_block(
        "Check-In Successful\n"
        "You checked in ON TIME at 09:02:17. Points earned: +2",
        "bot response"
    ))
    flow.append(p("Simultaneously, in #attendance-logs, the bot posts:"))
    flow.append(code_block(
        "Check-In: John Doe\n"
        "Time: 09:02:17\n"
        "Status: ON TIME\n"
        "Points: +2",
        "#attendance-logs"
    ))

    flow.append(h2("6.2 Task Management Commands"))

    task_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/task-create", "TL", "title, description, deadline, priority?, assignee?", "Create a new task. Posts to #task-assignments."],
        ["/task-assign", "TL", "task_id, member", "Assign an existing task to a member."],
        ["/task-complete", "Assignee / TL", "task_id, notes?", "Mark task complete. Awards 5 pts (+2 if early). Posts to #completed-tasks."],
        ["/task-list", "All", "status?, member?", "List tasks; filter by status (open/completed/all) or assignee."],
    ]
    flow.append(make_table(task_data, col_widths=[3.5*cm, 2.5*cm, 4.0*cm, 7.0*cm]))
    flow.append(spacer(8))

    flow.append(h3("Example: /task-create"))
    flow.append(p(
        "Suppose you want to assign John a high-priority task to draft the Q3 campaign brief by "
        "July 5 at 17:00. Run /task-create with these parameters:"
    ))
    flow.append(code_block(
        "title:        Draft Q3 Campaign Brief\n"
        "description:  Outline target audience, key messaging, channels, and budget for the\n"
        "              Q3 launch campaign. Aim for 3-5 pages.\n"
        "deadline:     2026-07-05 17:00\n"
        "priority:     High\n"
        "assignee:     @john",
        "command input"
    ))
    flow.append(p("The bot creates the task, assigns ID #1, and posts to #task-assignments:"))
    flow.append(code_block(
        "Task #1: Draft Q3 Campaign Brief\n"
        "Outline target audience, key messaging, channels, and budget for the Q3 launch campaign.\n"
        "\n"
        "Priority: HIGH\n"
        "Assignee: @john\n"
        "Deadline: 2026-07-05 17:00\n"
        "Created by: Team Leader",
        "#task-assignments"
    ))

    flow.append(h2("6.3 Report Commands"))

    rep_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/report-submit", "All", "completed, in_progress, blockers?, tomorrow?", "Submit daily report. Awards 3 pts. Posts to #daily-reports."],
        ["/report-view", "TL", "member?", "View today's reports. Filter by member if provided."],
    ]
    flow.append(make_table(rep_data, col_widths=[3.5*cm, 1.5*cm, 5.0*cm, 7.0*cm]))
    flow.append(spacer(8))

    flow.append(h3("Example: /report-submit"))
    flow.append(p("A typical daily report submission looks like:"))
    flow.append(code_block(
        "completed:    Drafted Q3 campaign brief; reviewed John's social media calendar;\n"
        "              fixed three bugs in the email automation flow.\n"
        "in_progress:  Finalizing the Q3 budget breakdown; waiting on design team for hero\n"
        "              image assets.\n"
        "blockers:     Need access to the Google Ads manager account — currently pending.\n"
        "tomorrow:     Finish budget breakdown; start drafting the paid ads plan.",
        "command input"
    ))

    flow.append(h2("6.4 Meeting Commands"))

    meet_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/meeting-schedule", "TL", "title, datetime_str, duration_minutes?, meeting_type?, agenda?", "Schedule a meeting. Posts to #announcements."],
        ["/meeting-attend", "All", "meeting_id", "Mark attendance. Awards 4 pts."],
    ]
    flow.append(make_table(meet_data, col_widths=[3.5*cm, 1.5*cm, 5.5*cm, 6.5*cm]))
    flow.append(spacer(8))

    flow.append(h3("Example: /meeting-schedule"))
    flow.append(p("To schedule the weekly team meeting:"))
    flow.append(code_block(
        "title:            Weekly Team Sync\n"
        "datetime_str:     2026-07-07 14:00\n"
        "duration_minutes: 45\n"
        "meeting_type:     Weekly Team Meeting\n"
        "agenda:           Q3 campaign progress; budget review; task assignments for week of July 7",
        "command input"
    ))

    flow.append(h2("6.5 Performance Commands"))

    perf_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/leaderboard", "All", "period?", "Show top 10 performers. Period: weekly, monthly, or total."],
        ["/performance", "All (TL for others)", "member?", "View detailed stats: points, attendance, tasks, reports."],
        ["/kudos", "All", "member, reason", "Thank a teammate. Awards them 2 pts. Posts to #kudos."],
    ]
    flow.append(make_table(perf_data, col_widths=[3.0*cm, 3.0*cm, 3.5*cm, 7.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("6.6 Knowledge Base Commands"))

    kb_data = [
        ["Command", "Who", "Parameters", "Description"],
        ["/kb-add", "TL / Senior", "title, url, category, summary?", "Add a tagged KB entry. Posts to #knowledge-base."],
    ]
    flow.append(make_table(kb_data, col_widths=[3.0*cm, 2.5*cm, 5.5*cm, 6.0*cm]))
    flow.append(spacer(8))
    flow.append(p(
        "Categories are: Playbook, Template, Brand Guide, Tool Tutorial, Case Study, FAQ. The bot "
        "tags each entry with the category name in the title (e.g., [Playbook] How to Run a Product "
        "Launch) so members can filter the channel by typing the tag in the search bar.",
        'body_justified'
    ))

    flow.append(h2("6.7 Help Command"))
    flow.append(p(
        "Run /help at any time to see a categorized list of all available commands with one-line "
        "descriptions. The help response is ephemeral, so it does not clutter the channel."
    ))

    return flow


def chapter_7():
    flow = []
    flow.append(h1("Chapter 7: Daily Workflow & Best Practices"))

    flow.append(h2("7.1 The Daily Cadence"))
    flow.append(p(
        "A successful Discord-based team runs on a predictable daily cadence. The Team Leader's "
        "job is to set the rhythm, reinforce it for the first two weeks, and then step back and "
        "let the team self-regulate. The recommended cadence for a marketing team working 09:00 to "
        "18:00 in a single time zone is shown below. Adjust the times to fit your team's hours.",
        'body_justified'
    ))

    cadence_data = [
        ["Time", "Activity", "Owner", "Tool / Channel"],
        ["09:00", "Bot sends morning check-in reminder", "Bot (automatic)", "#check-in"],
        ["09:00–10:00", "Members check in", "All members", "/checkin command"],
        ["10:00", "Check-in deadline (late thereafter)", "Bot (automatic)", "Points deduction"],
        ["10:15", "Team Leader reviews attendance", "Team Leader", "/attendance"],
        ["10:15", "Team Leader assigns daily tasks", "Team Leader", "/task-create"],
        ["10:30", "Brief morning standup (optional)", "Team Leader + volunteers", "Meeting Room"],
        ["Throughout day", "Members work on tasks", "All members", "#task-progress"],
        ["14:00", "Mid-day progress check (optional)", "Team Leader", "Scan #task-progress"],
        ["17:00", "Bot sends report reminder", "Bot (automatic)", "#daily-reports"],
        ["17:00–18:00", "Members submit daily reports", "All members", "/report-submit"],
        ["18:00", "Report deadline", "Bot (automatic)", "—"],
        ["18:00", "Members check out", "All members", "/checkout"],
        ["Friday 16:00", "Bot posts weekly summary", "Bot (automatic)", "#weekly-summary"],
        ["Friday 16:30", "Weekly team retro", "Team Leader + all", "Meeting Room"],
    ]
    flow.append(make_table(cadence_data, col_widths=[3.0*cm, 5.5*cm, 4.0*cm, 4.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("7.2 Team Leader's Daily Checklist"))
    flow.append(p(
        "As Team Leader, your day has four high-leverage moments. Spending five to ten minutes at "
        "each of these moments is enough to keep the team aligned without micromanaging."
    ))
    flow.append(h3("Morning (10:00–10:30)"))
    morning = [
        "Run /attendance to see who has checked in. Note anyone late or absent.",
        "Scan #task-progress for overnight questions or blockers that need your input.",
        "Run /task-create for any new tasks that came in overnight. Assign immediately.",
        "Post a brief morning message in #announcements summarizing the day's priorities.",
    ]
    for it in morning:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h3("Mid-day (14:00–14:30)"))
    midday = [
        "Scan #task-progress for stalled conversations or questions that went unanswered.",
        "Check #task-assignments for any tasks that have not been picked up.",
        "Drop into the Meeting Room voice channel if anyone is working there and needs a quick sync.",
    ]
    for it in midday:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h3("End-of-day (17:30–18:00)"))
    eod = [
        "Run /report-view to read each member's daily report.",
        "Reply directly (via DM or in #task-progress) to any report that flags a blocker.",
        "Note any tasks marked complete in #completed-tasks and acknowledge them publicly.",
        "Run /attendance one final time to confirm everyone checked out.",
    ]
    for it in eod:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h3("Friday (16:00–17:00)"))
    friday = [
        "Read the auto-posted weekly summary in #weekly-summary.",
        "Run /leaderboard weekly to see the points ranking. Mention the top performer in #announcements.",
        "Host a 30-minute weekly retro in the Meeting Room. Use #meeting-notes for live notes.",
        "Plan the following week's major tasks so you can assign them Monday morning.",
    ]
    for it in friday:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h2("7.3 Communication Etiquette"))
    flow.append(p(
        "Discord can become noisy quickly if the team does not agree on communication norms. The "
        "following etiquette should be posted in #rules on day one and reinforced for the first two "
        "weeks. After that, it becomes self-enforcing.",
        'body_justified'
    ))
    etiquette = [
        "<b>Use threads for any conversation longer than three messages.</b> Threads keep the main "
        "channel scannable and let people opt out of discussions that do not concern them.",
        "<b>@mention sparingly.</b> Reserve @here for time-sensitive items that need attention "
        "within the hour. Reserve @everyone for true emergencies. For individuals, use @name only "
        "when you need their direct input — not just to acknowledge that you saw their message.",
        "<b>Post updates in the right channel.</b> Task progress goes in #task-progress, not in "
        "#social-media. Department-specific questions go in the department channel. General "
        "announcements go in #announcements.",
        "<b>Respect working hours.</b> Do not @mention anyone outside their stated working hours "
        "unless it is a true emergency. Discord's Do Not Disturb mode is a signal to wait until "
        "morning.",
        "<b>Be explicit about blockers.</b> If you are blocked, say so in #task-progress and tag "
        "the Team Leader. Suffering in silence helps no one.",
    ]
    for it in etiquette:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h2("7.4 Onboarding New Members"))
    flow.append(p(
        "When a new member joins, follow this five-step onboarding checklist. The first day sets "
        "the tone for their entire tenure on the team, so invest thirty minutes up front to save "
        "hours of confusion later.",
        'body_justified'
    ))
    onboarding = [
        "Assign the Junior Marketer role. Walk them through the server structure (categories, channels, voice rooms).",
        "Have them read #rules and #team-info. Answer any questions.",
        "Show them the /help command and walk through /checkin, /report-submit, and /task-list.",
        "Assign them one small task using /task-create so they can practice the workflow end-to-end.",
        "Pair them with a Senior Marketer as a buddy for their first two weeks. The buddy answers day-to-day questions and reviews their first three daily reports.",
    ]
    for i, step in enumerate(onboarding, 1):
        flow.append(Paragraph(f"<b>{i}.</b> {step}", S['bullet']))
    flow.append(spacer(8))

    return flow


def chapter_8():
    flow = []
    flow.append(h1("Chapter 8: Performance Tracking & KPIs"))

    flow.append(h2("8.1 The Points System"))
    flow.append(p(
        "The bot's points system is the quantitative backbone of performance tracking. Every "
        "positive behavior earns points; the weekly and monthly leaderboards make those points "
        "visible to the entire team. The points are not a substitute for substantive performance "
        "reviews — they are a leading indicator that helps you spot patterns early and start "
        "conversations before small issues become big ones.",
        'body_justified'
    ))

    pts_data = [
        ["Action", "Points", "Notes"],
        ["On-time check-in (before deadline)", "+2", "Daily, up to 10 pts/week"],
        ["Late check-in (after deadline)", "+1", "Half credit, no penalty"],
        ["Task completed", "+5", "Per task, regardless of size"],
        ["Task completed early (before deadline)", "+7", "Bonus for proactive delivery"],
        ["Daily report submitted", "+3", "Daily, up to 15 pts/week"],
        ["Meeting attended", "+4", "Per meeting"],
        ["Kudos received from peer", "+2", "Capped at 10 pts/week from kudos"],
    ]
    flow.append(make_table(pts_data, col_widths=[7.0*cm, 2.0*cm, 7.0*cm]))
    flow.append(spacer(8))

    flow.append(p(
        "A typical active member who checks in on time every day, submits five reports, completes "
        "five tasks (one early), attends one meeting, and receives three kudos earns: 10 + 15 + 25 "
        "+ 2 + 4 + 6 = 62 points per week. Use this as a baseline when reviewing individual "
        "performance — anyone significantly below 40 points per week is either disengaged, "
        "blocked, or unaware of available tasks, and warrants a one-on-one conversation.",
        'body_justified'
    ))

    flow.append(h2("8.2 Key Performance Indicators"))
    flow.append(p(
        "Beyond raw points, the bot tracks four KPIs that together paint a complete picture of "
        "each member's contribution. Review these in your weekly one-on-ones and quarterly "
        "performance reviews."
    ))

    kpi_data = [
        ["KPI", "What It Measures", "Healthy Range", "Action if Below"],
        ["Attendance rate", "% of working days checked in", "≥ 95%", "Discuss time management; check for burnout"],
        ["Punctuality rate", "% of check-ins on time", "≥ 85%", "Investigate scheduling conflicts; review workload"],
        ["Task completion rate", "% of assigned tasks completed", "≥ 90%", "Review task scoping; check for blockers"],
        ["Report consistency", "% of working days with report submitted", "≥ 95%", "Reinforce habit; pair with buddy"],
    ]
    flow.append(make_table(kpi_data, col_widths=[3.5*cm, 4.5*cm, 3.5*cm, 5.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("8.3 Using the Leaderboard"))
    flow.append(p(
        "The leaderboard is a tool for recognition, not punishment. Use it to celebrate wins and "
        "spot quiet contributors — the members who consistently deliver without making noise. "
        "Avoid using it to shame low performers; that creates a hostile culture and incentivizes "
        "gaming the system (e.g., checking in then disappearing).",
        'body_justified'
    ))
    flow.append(p(
        "In your Friday wrap-up message, mention the top three performers by name and call out "
        "the specific behavior that earned their points (\"John led the week with 78 points, "
        "driven by completing three tasks early and submitting all five daily reports on time\"). "
        "This is more meaningful than just announcing the ranking and reinforces the behaviors you "
        "want to see.",
        'body_justified'
    ))

    flow.append(h2("8.4 Quarterly Review Template"))
    flow.append(p(
        "Every quarter, run a structured review with each member using the bot's data as a "
        "starting point. The review has four parts:"
    ))
    review = [
        "<b>Quantitative review</b> — pull /performance for the past 13 weeks. Look at trends: is "
        "attendance stable, declining, or improving? Is task completion rate steady? Are reports "
        "consistent?",
        "<b>Qualitative review</b> — review the member's daily reports from the quarter. What did "
        "they learn? What did they struggle with? What were their biggest wins?",
        "<b>Goal-setting</b> — set three goals for the next quarter: one skill to develop, one "
        "process to improve, one outcome to deliver. Document these in #tl-decisions.",
        "<b>Feedback</b> — ask the member for feedback on your leadership and on the team's "
        "workflow. Listen without defending. Adjust based on what you hear.",
    ]
    for it in review:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    return flow


def chapter_9():
    flow = []
    flow.append(h1("Chapter 9: Meeting Management"))

    flow.append(h2("9.1 Meeting Types and Frequency"))
    flow.append(p(
        "Meetings are expensive — a 30-minute meeting with eight people consumes four person-hours "
        "of work. Run only the meetings that have a clear purpose, and keep them tight. The "
        "recommended meeting cadence for a marketing team of fifteen is:"
    ))

    meet_data = [
        ["Meeting", "Frequency", "Duration", "Attendees", "Purpose"],
        ["Daily standup", "Mon–Thu", "10 min", "All", "Quick round-robin: yesterday, today, blockers"],
        ["Weekly team sync", "Friday", "45 min", "All", "Week review, next week planning, kudos"],
        ["Project review", "Per project", "30 min", "Project squad", "Status, risks, decisions"],
        ["1-on-1", "Bi-weekly", "30 min", "TL + member", "Personal check-in, growth, feedback"],
        ["Quarterly review", "Quarterly", "60 min", "TL + member", "Performance, goals, development"],
    ]
    flow.append(make_table(meet_data, col_widths=[3.5*cm, 2.5*cm, 2.0*cm, 3.0*cm, 6.0*cm]))
    flow.append(spacer(8))

    flow.append(h2("9.2 Scheduling with the Bot"))
    flow.append(p(
        "Use /meeting-schedule to announce any meeting at least 24 hours in advance. The bot posts "
        "the meeting details to #announcements with the title, type, time, duration, and agenda. "
        "Members who attend run /meeting-attend to record their presence and earn four points. "
        "This creates a soft attendance incentive and gives you a quantifiable attendance record "
        "for each meeting.",
        'body_justified'
    ))

    flow.append(h2("9.3 Running a Daily Standup"))
    flow.append(p(
        "The daily standup is the team's most frequent meeting, so it must be efficient. Hold it "
        "in the Meeting Room voice channel at the same time every day (10:30 is a good slot — "
        "after check-in, before deep work). The format is simple: each member answers three "
        "questions in under two minutes."
    ))
    standup = [
        "<b>Yesterday:</b> What did you complete yesterday?",
        "<b>Today:</b> What are you working on today?",
        "<b>Blockers:</b> Is anything blocking your progress?",
    ]
    for it in standup:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))
    flow.append(p(
        "As Team Leader, your job is to keep the standup moving. If a conversation needs more than "
        "two minutes, ask the relevant members to take it to a thread in #task-progress after the "
        "standup. Do not let the standup become a status report — status belongs in daily reports. "
        "The standup is for alignment and unblocking.",
        'body_justified'
    ))

    flow.append(h2("9.4 Weekly Team Sync Agenda"))
    flow.append(p(
        "The Friday weekly sync is the team's most important meeting. Use it to close out the "
        "week, celebrate wins, and set up the next week. A 45-minute agenda that works well:"
    ))
    agenda = [
        "<b>0:00–0:05 — Icebreaker</b>: Quick round-robin with a fun question (\"best thing that happened this week\").",
        "<b>0:05–0:15 — Week in review</b>: Walk through #completed-tasks. Call out notable wins.",
        "<b>0:15–0:25 — Metrics review</b>: Share any marketing metrics (traffic, conversions, engagement) from the week.",
        "<b>0:25–0:35 — Next week's priorities</b>: Discuss the top three priorities for next week. Assign owners.",
        "<b>0:35–0:40 — Blockers and asks</b>: Anyone blocked? Anyone need help?",
        "<b>0:40–0:45 — Kudos and leaderboard</b>: Announce the weekly leaderboard top three. Give kudos.",
    ]
    for it in agenda:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h2("9.5 Meeting Notes and Follow-up"))
    flow.append(p(
        "Designate a note-taker for every meeting (rotate the role weekly). The note-taker types "
        "key decisions and action items into #meeting-notes in real time, then formats and pins "
        "the notes at the end of the meeting with a clear title. After the meeting, the Team "
        "Leader creates tasks from the action items using /task-create, so every action item has "
        "an owner and a deadline tracked in the system.",
        'body_justified'
    ))

    return flow


def chapter_10():
    flow = []
    flow.append(h1("Chapter 10: Knowledge Base & Documentation"))

    flow.append(h2("10.1 Why a Knowledge Base Matters"))
    flow.append(p(
        "Marketing teams generate enormous amounts of tacit knowledge: which ad copy converts "
        "best, which email subject lines get the highest open rates, which design templates match "
        "the brand voice, which analytics dashboards matter. Without a structured knowledge base, "
        "this knowledge lives in individual heads and Slack DMs, and it walks out the door when "
        "team members leave. A well-maintained #knowledge-base channel turns tacit knowledge into "
        "explicit, searchable institutional memory.",
        'body_justified'
    ))

    flow.append(h2("10.2 The Six Category Tags"))
    flow.append(p(
        "The bot's /kb-add command requires a category tag for every entry. The six categories "
        "are deliberately broad — narrower tags lead to fragmentation and inconsistent tagging. "
        "If an entry does not fit one of the six, it probably belongs in a different channel."
    ))

    kb_cat_data = [
        ["Tag", "What Goes Here", "Example"],
        ["[Playbook]", "Step-by-step procedures for recurring marketing activities", "How to launch a paid social campaign"],
        ["[Template]", "Reusable templates for documents, emails, ad copy", "Q3 campaign brief template"],
        ["[Brand Guide]", "Brand standards: voice, tone, colors, fonts, logo usage", "Brand voice do's and don'ts"],
        ["[Tool Tutorial]", "How-to guides for marketing tools (Google Analytics, Mailchimp, etc.)", "Setting up conversion tracking in GA4"],
        ["[Case Study]", "Post-mortems of completed campaigns with metrics", "Spring 2026 email campaign — what worked"],
        ["[FAQ]", "Answers to commonly asked questions from clients or team", "How to request design assets"],
    ]
    flow.append(make_table(kb_cat_data, col_widths=[3.0*cm, 6.0*cm, 7.5*cm]))
    flow.append(spacer(8))

    flow.append(h2("10.3 Contributing to the Knowledge Base"))
    flow.append(p(
        "Team Leaders and Senior Marketers can add entries using /kb-add. The command takes a "
        "title, a URL (link to a Google Doc, Notion page, Loom video, or external resource), the "
        "category, and an optional summary. The bot formats the entry as an embed and posts it to "
        "#knowledge-base."
    ))
    flow.append(p(
        "Encourage all team members to suggest KB entries by posting in #task-progress. When a "
        "member has a question that takes more than a few sentences to answer, the answer is "
        "probably KB-worthy. The Senior Marketer or Team Leader can then formalize it into a KB "
        "entry. This balances quality control (only Seniors and TLs can post) with broad "
        "contribution (anyone can suggest).",
        'body_justified'
    ))

    flow.append(h2("10.4 Searching the Knowledge Base"))
    flow.append(p(
        "Discord's search bar at the top right of the channel supports keyword search, user "
        "search, date filters, and channel filters. To search the knowledge base, click the "
        "search bar, type \"in:#knowledge-base <keywords>\", and press Enter. To filter by tag, "
        "include the tag in your search (e.g., \"in:#knowledge-base [Playbook] campaign\")."
    ))
    flow.append(p(
        "Pin the five to ten most-frequently-referenced entries using Discord's pin feature. "
        "Pinned messages appear in a dedicated panel accessible by clicking the pin icon at the "
        "top of the channel, which makes them instantly findable even for new members who do not "
        "know what to search for.",
        'body_justified'
    ))

    flow.append(h2("10.5 Maintenance and Pruning"))
    flow.append(p(
        "Schedule a quarterly KB review (add it to your calendar as a recurring event). During "
        "the review, scan all entries from the past quarter. Archive outdated entries (delete the "
        "message or move to a #kb-archive channel), update entries whose content has changed, and "
        "consolidate duplicate entries. A bloated knowledge base is almost as bad as no knowledge "
        "base, because members cannot find what they need.",
        'body_justified'
    ))

    return flow


def chapter_11():
    flow = []
    flow.append(h1("Chapter 11: Troubleshooting & Maintenance"))

    flow.append(h2("11.1 Common Issues and Solutions"))

    flow.append(h3("Bot not responding to slash commands"))
    flow.append(p(
        "If the bot is online (green dot in the member list) but slash commands do not appear or "
        "do not respond, check the following in order:"
    ))
    cmd_issues = [
        "Verify the bot was invited with the applications.commands scope. If you only checked \"bot\" in the OAuth2 URL generator, slash commands will not register. Re-invite the bot with both scopes.",
        "Verify guild_id in config.json is set to your server's ID. Without it, commands register globally and can take up to an hour to appear.",
        "Restart the bot. Slash command syncing happens on startup; if you changed config.json, the bot needs a restart.",
        "Check the bot log (bot.log) for sync errors. Common causes: missing permissions, malformed command definitions, or duplicate command names.",
    ]
    for it in cmd_issues:
        flow.append(Paragraph(f"• {it}", S['bullet']))
    flow.append(spacer(6))

    flow.append(h3("Permission errors"))
    flow.append(p(
        "If the bot posts error messages about missing permissions, the most common cause is role "
        "hierarchy: Discord only lets a role manage roles below it. Make sure the bot's role is "
        "placed at the top of the role list (or at least above all the roles it needs to "
        "interact with). Also verify the bot has the permissions you granted during invitation — "
        "if a server admin changed permissions after the bot was invited, you may need to "
        "re-invite with the correct permissions.",
        'body_justified'
    ))

    flow.append(h3("Members cannot see a channel"))
    flow.append(p(
        "If a member reports they cannot see a channel they should be able to, check the channel's "
        "permission overrides (right-click channel → Edit Channel → Permissions). Look for a deny "
        "on \"View Channel\" for either @everyone or the member's role. Common mistake: denying "
        "View Channel for @everyone on a public channel accidentally hides it from everyone.",
        'body_justified'
    ))

    flow.append(h3("Attendance not registering"))
    flow.append(p(
        "If /checkin runs but no embed appears in #attendance-logs, verify the attendance_logs "
        "channel ID in config.json is correct (right-click channel → Copy ID). Also verify the bot "
        "has \"Send Messages\" and \"Embed Links\" permissions in that channel. If the bot can "
        "post in other channels but not this one, the issue is channel-specific permissions.",
        'body_justified'
    ))

    flow.append(h3("Bot crashes on startup"))
    flow.append(p(
        "If the bot crashes immediately on startup, the most common cause is a missing or invalid "
        "config.json. Verify that the token field is set to your actual bot token (not the "
        "placeholder), that guild_id is a valid integer, and that all channel and role IDs are "
        "integers (not strings). Check bot.log for the specific error message.",
        'body_justified'
    ))

    flow.append(h2("11.2 Routine Maintenance Tasks"))

    maint_data = [
        ["Frequency", "Task", "How"],
        ["Daily", "Read daily reports", "Scan #daily-reports"],
        ["Daily", "Acknowledge completed tasks", "React to #completed-tasks posts"],
        ["Weekly", "Run /leaderboard weekly", "Announce top performers in #announcements"],
        ["Weekly", "Archive finished project channels", "Right-click → Archive Channel"],
        ["Monthly", "Review role assignments", "Promote Juniors ready for Specialist"],
        ["Monthly", "Audit channel permissions", "Verify private channels still private"],
        ["Monthly", "Backup data files", "Copy data/ folder to cloud storage"],
        ["Quarterly", "Review points configuration", "Adjust values in config.json if needed"],
        ["Quarterly", "KB pruning", "Archive outdated KB entries"],
        ["Quarterly", "Conduct 1-on-1 reviews", "Use /performance data as starting point"],
    ]
    flow.append(make_table(maint_data, col_widths=[2.5*cm, 6.0*cm, 8.0*cm]))
    flow.append(spacer(8))

    flow.append(h2("11.3 Data Backup"))
    flow.append(p(
        "The bot stores all data in JSON files in the data/ directory: attendance.json, tasks.json, "
        "reports.json, points.json, and meetings.json. These files are the team's institutional "
        "memory — losing them means losing months of performance data and historical reports. Back "
        "them up at least monthly by copying the entire data/ folder to cloud storage (Google "
        "Drive, Dropbox, S3). For teams that rely heavily on the data, set up an automated daily "
        "rsync or cron job to copy the files to a remote location.",
        'body_justified'
    ))

    flow.append(h2("11.4 Bot Updates"))
    flow.append(p(
        "When you update bot.py (either to apply a fix from this guide's author or to add your own "
        "features), follow this safe-update procedure: stop the bot, back up the data/ folder, "
        "replace bot.py with the new version, restart the bot, and immediately run /checkin and "
        "/task-list to verify the bot is functioning. If anything looks wrong, stop the bot, "
        "restore the old bot.py, and restart. Never edit bot.py while the bot is running — the "
        "file may be partially written when the bot tries to reload it.",
        'body_justified'
    ))

    return flow


def appendix_a():
    flow = []
    flow.append(h1("Appendix A: Complete File Structure"))

    flow.append(p(
        "The bot is delivered as a single folder containing five files plus a data directory that "
        "is auto-created on first run. This appendix describes each file's purpose and what you "
        "should and should not edit."
    ))

    file_data = [
        ["File", "Editable?", "Purpose"],
        ["bot.py", "Yes (advanced)", "Main bot file. Contains all commands, scheduled tasks, and the bot's startup logic. Edit only if you want to add or modify commands."],
        ["config.json", "Yes (required)", "Configuration: bot token, channel IDs, role IDs, schedule, points. Must be edited before first run."],
        ["requirements.txt", "No", "List of Python dependencies. Used by pip install -r requirements.txt. Do not edit unless you add new dependencies."],
        ["README.md", "No", "Quick-start documentation. Reference if you need to remember how to set up the bot."],
        ["setup_helper.py", "No", "Optional helper script. Prints all channel and role IDs from your server so you can copy them into config.json."],
        [".gitignore", "No", "Tells Git to ignore data/, venv/, and config.json (to protect your token). Do not edit."],
        ["bot.log", "No (auto)", "Auto-generated log file. Useful for debugging. Rotate or delete periodically to save disk space."],
        ["data/attendance.json", "No (auto)", "Auto-generated. Stores all attendance records."],
        ["data/tasks.json", "No (auto)", "Auto-generated. Stores all tasks."],
        ["data/reports.json", "No (auto)", "Auto-generated. Stores all daily reports."],
        ["data/points.json", "No (auto)", "Auto-generated. Stores all points data."],
        ["data/meetings.json", "No (auto)", "Auto-generated. Stores all meetings."],
    ]
    flow.append(make_table(file_data, col_widths=[4.0*cm, 3.0*cm, 9.5*cm]))
    flow.append(spacer(8))

    return flow


def appendix_b():
    flow = []
    flow.append(h1("Appendix B: Quick Start Checklist"))

    flow.append(p(
        "Use this one-page checklist to track your progress through the full setup. Print it out "
        "and check off each step as you complete it. Estimated total time: 2–3 hours for a team "
        "of fifteen."
    ))

    flow.append(h2("Phase 1: Discord Server Setup (45 minutes)"))
    phase1 = [
        "Create the Discord server (or use existing one)",
        "Create all 9 categories in order (Information, Attendance, Tasks, Departments, Projects, Reports, Performance, Meetings, TL)",
        "Create all channels under each category (refer to Chapter 2 table)",
        "Set channel topics for each channel",
        "Create the 5 roles (Team Leader, Senior, Specialist, Junior, Guest) in order",
        "Assign role colors (Blurple, Green, Yellow, Grey, Fuchsia)",
        "Configure permission overrides on #tl-private and #tl-decisions",
        "Invite team members and assign roles",
    ]
    for i, step in enumerate(phase1, 1):
        flow.append(Paragraph(f"☐ &nbsp; {step}", S['bullet']))
    flow.append(spacer(8))

    flow.append(h2("Phase 2: Bot Setup (45 minutes)"))
    phase2 = [
        "Install Python 3.10+ on your machine or server",
        "Download bot files (bot.py, config.json, requirements.txt) to a folder",
        "Create a Discord application at discord.com/developers/applications",
        "Add a bot to the application; copy the bot token",
        "Enable Server Members Intent and Message Content Intent",
        "Generate OAuth2 URL with bot + applications.commands scopes and required permissions",
        "Open the URL and authorize the bot to join your server",
        "Open terminal in the bot folder; create virtual environment (python -m venv venv)",
        "Activate virtual environment and run pip install -r requirements.txt",
        "Enable Developer Mode in Discord; copy server ID, channel IDs, role IDs",
        "Edit config.json: set token, guild_id, all channel IDs, all role IDs",
        "Adjust schedule times and timezone to match your team",
        "Run python bot.py and verify startup logs",
        "Test /checkin and /help commands in Discord",
    ]
    for i, step in enumerate(phase2, 1):
        flow.append(Paragraph(f"☐ &nbsp; {step}", S['bullet']))
    flow.append(spacer(8))

    flow.append(h2("Phase 3: Team Launch (30 minutes)"))
    phase3 = [
        "Post welcome message in #announcements explaining the new system",
        "Pin the rules in #rules (use template from Chapter 4)",
        "Post team roster in #team-info",
        "Run a 15-minute kickoff meeting in Meeting Room explaining the workflow",
        "Have each member run /checkin to test the bot",
        "Assign each member one task using /task-create",
        "Demonstrate /report-submit at end of day",
        "Schedule the first weekly sync using /meeting-schedule",
    ]
    for i, step in enumerate(phase3, 1):
        flow.append(Paragraph(f"☐ &nbsp; {step}", S['bullet']))
    flow.append(spacer(8))

    flow.append(h2("Phase 4: First Week Monitoring (ongoing)"))
    phase4 = [
        "Day 1: Verify everyone checked in; address any bot issues",
        "Day 2: Confirm daily reports are being submitted",
        "Day 3: Mid-week pulse check in #task-progress",
        "Day 4: Review task completion rate; assign weekend tasks if any",
        "Day 5: Read weekly summary; run weekly sync; announce leaderboard",
        "Week 2: Start bi-weekly 1-on-1s; begin promoting eligible Juniors",
    ]
    for i, step in enumerate(phase4, 1):
        flow.append(Paragraph(f"☐ &nbsp; {step}", S['bullet']))

    return flow


# ============================================================
# Main Build
# ============================================================

def build_pdf(output_path: str):
    """Build the complete PDF."""

    doc = MyDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title="Discord Server Setup Guide for Marketing Team Leaders",
        author="Z.ai",
        subject="Complete setup manual for Discord-based team management",
        creator="Z.ai PDF Generator",
    )

    # Cover page (full-bleed frame, no margins)
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=MARGIN_L, rightPadding=MARGIN_R,
                       topPadding=0, bottomPadding=0, id='cover_frame', showBoundary=0)
    cover_template = PageTemplate(id='cover', frames=[cover_frame], onPage=cover_canvas)

    # Body page (with margins and header/footer)
    body_frame = Frame(MARGIN_L, MARGIN_B + 20, CONTENT_W, CONTENT_H - 30,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
                      id='body_frame', showBoundary=0)
    body_template = PageTemplate(id='body', frames=[body_frame], onPage=body_canvas)

    doc.addPageTemplates([cover_template, body_template])

    # Build story
    story = []
    # Cover
    story.extend(build_cover())
    # TOC
    story.extend(build_toc())
    # Chapters
    story.extend(chapter_1())
    story.extend(chapter_2())
    story.extend(chapter_3())
    story.extend(chapter_4())
    story.extend(chapter_5())
    story.extend(chapter_6())
    story.extend(chapter_7())
    story.extend(chapter_8())
    story.extend(chapter_9())
    story.extend(chapter_10())
    story.extend(chapter_11())
    story.extend(appendix_a())
    story.extend(appendix_b())

    # Build
    doc.multiBuild(story)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    output = "/home/z/my-project/download/discord-team-server/Discord_Server_Setup_Guide.pdf"
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    build_pdf(output)
