#!/usr/bin/env python3
"""
Clean up color classes across all module files.
Replace emerald/teal/amber color classes with new theme-based classes.
"""
import re
import os

MODULES_DIR = "/home/z/my-project/src/components/modules"

# Replacements (order matters)
REPLACEMENTS = [
    # Emerald gradients -> primary
    (r"bg-gradient-to-r from-emerald-600 to-teal-600[^\"]*", "bg-primary text-primary-foreground hover:bg-primary/90"),
    (r"bg-gradient-to-r from-emerald-600 to-teal-600", "bg-primary text-primary-foreground hover:bg-primary/90"),
    (r"bg-gradient-to-l from-emerald-500 to-teal-600[^\"]*", "bg-primary text-primary-foreground"),
    (r"bg-gradient-to-r from-emerald-500 to-teal-600[^\"]*", "bg-primary text-primary-foreground"),
    (r"bg-gradient-to-br from-emerald-500 to-teal-600[^\"]*", "bg-primary"),
    (r"bg-gradient-to-br from-emerald-100 to-teal-100[^\"]*", "bg-muted text-foreground"),
    (r"bg-gradient-to-b from-amber-50 to-amber-100[^\"]*", "bg-primary text-primary-foreground"),
    (r"bg-gradient-to-b from-slate-50 to-slate-100[^\"]*", "bg-muted text-foreground"),
    (r"bg-gradient-to-b from-orange-50 to-orange-100[^\"]*", "bg-muted text-foreground"),
    (r"bg-gradient-to-r from-amber-500 to-orange-500[^\"]*", "bg-primary text-primary-foreground hover:bg-primary/90"),
    (r"bg-gradient-to-r from-amber-500 to-orange-600[^\"]*", "bg-primary text-primary-foreground hover:bg-primary/90"),

    # Border emerald -> border
    (r"border-emerald-\d+", "border-border"),
    (r"border-amber-\d+", "border-border"),
    (r"border-teal-\d+", "border-border"),
    (r"border-red-\d+", "border-destructive/40"),
    (r"border-pink-\d+", "border-border"),
    (r"border-orange-\d+", "border-border"),
    (r"border-slate-\d+", "border-border"),
    (r"border-blue-\d+", "border-border"),

    # Background emerald/teal/amber tints -> muted
    (r"bg-emerald-50[^\"]*", "bg-muted/50"),
    (r"bg-emerald-100[^\"]*", "bg-muted"),
    (r"bg-teal-50[^\"]*", "bg-muted/50"),
    (r"bg-teal-100[^\"]*", "bg-muted"),
    (r"bg-amber-50[^\"]*", "bg-muted/50"),
    (r"bg-amber-100[^\"]*", "bg-muted"),
    (r"bg-amber-50/30", "bg-muted/30"),
    (r"bg-amber-50/50", "bg-muted/50"),
    (r"bg-emerald-50/30", "bg-muted/30"),
    (r"bg-emerald-50/50", "bg-muted/50"),
    (r"bg-pink-50/50", "bg-muted/50"),
    (r"bg-pink-50[^\"]*", "bg-muted/50"),
    (r"bg-blue-50[^\"]*", "bg-muted/50"),
    (r"bg-red-50[^\"]*", "bg-destructive/5"),
    (r"bg-red-50/50", "bg-destructive/5"),
    (r"bg-orange-50[^\"]*", "bg-muted/50"),
    (r"bg-slate-50[^\"]*", "bg-muted/50"),
    (r"bg-slate-100[^\"]*", "bg-muted"),

    # Text colors -> primary or foreground
    (r"text-emerald-900", "text-foreground"),
    (r"text-emerald-700", "text-primary"),
    (r"text-emerald-600", "text-primary"),
    (r"text-teal-900", "text-foreground"),
    (r"text-teal-700", "text-primary"),
    (r"text-teal-600", "text-primary"),
    (r"text-amber-900", "text-foreground"),
    (r"text-amber-700", "text-primary"),
    (r"text-amber-600", "text-primary"),
    (r"text-amber-500", "text-primary"),
    (r"text-pink-500", "text-primary"),
    (r"text-pink-600", "text-primary"),
    (r"text-pink-700", "text-primary"),
    (r"text-orange-500", "text-primary"),
    (r"text-orange-700", "text-primary"),
    (r"text-slate-500", "text-muted-foreground"),
    (r"text-slate-700", "text-foreground"),
    (r"text-red-600", "text-destructive"),
    (r"text-red-700", "text-destructive"),
    (r"text-red-900", "text-destructive"),
    (r"text-blue-700", "text-primary"),
    (r"text-blue-600", "text-primary"),

    # Hover backgrounds
    (r"hover:bg-emerald-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-amber-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-teal-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-red-\d+[^\"]*", "hover:bg-destructive/10"),
    (r"hover:bg-pink-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-slate-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-blue-\d+[^\"]*", "hover:bg-accent"),
    (r"hover:bg-orange-\d+[^\"]*", "hover:bg-accent"),

    # shadows
    (r"shadow-emerald-\d+[^\"]*", "shadow-sm"),
    (r"shadow-amber-\d+[^\"]*", "shadow-sm"),

    # Text white on dark
    (r"text-white", "text-primary-foreground"),

    # Specific button classes
    (r"bg-emerald-600[^\"]*hover:bg-emerald-700", "bg-primary hover:bg-primary/90 text-primary-foreground"),
    (r"bg-emerald-600", "bg-primary text-primary-foreground hover:bg-primary/90"),
    (r"bg-amber-600[^\"]*", "bg-primary text-primary-foreground"),
    (r"bg-red-600[^\"]*hover:bg-red-\d+", "bg-destructive hover:bg-destructive/90 text-destructive-foreground"),
    (r"bg-red-600", "bg-destructive text-destructive-foreground hover:bg-destructive/90"),
    (r"bg-pink-100[^\"]*", "bg-muted"),
    (r"bg-pink-600[^\"]*", "bg-primary"),

    # Specific badge colors that should stay semantic
    # (leave PRIORITY_COLORS and STATUS_COLORS from auth-labels.ts alone)
]

# Emojis to remove
EMOJIS = [
    "👋", "🎉", "✅", "❌", "⏰", "📝", "🎯", "📊", "🏆", "📢", "🔒",
    "🎙️", "🚀", "📚", "👥", "⭐", "✨", "🔥", "💡", "📋", "✔️", "★"
]

def clean_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Apply color replacements
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)

    # Remove emojis
    for emoji in EMOJIS:
        content = content.replace(emoji, "")

    # Clean up any double spaces left after emoji removal
    content = re.sub(r"  +", " ", content)
    # Clean up trailing spaces before punctuation
    content = re.sub(r"\s+([,.;:!])", r"\1", content)

    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

if __name__ == "__main__":
    changed = 0
    for filename in os.listdir(MODULES_DIR):
        if filename.endswith(".tsx"):
            filepath = os.path.join(MODULES_DIR, filename)
            if clean_file(filepath):
                changed += 1
                print(f"  Updated: {filename}")
    print(f"\nTotal files updated: {changed}")
