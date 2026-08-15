#!/usr/bin/env python3
"""Fix double-encoded UTF-8 (mojibake) in index.html.

When a UTF-8 file is read as Latin-1 and re-saved as UTF-8,
each original UTF-8 byte B gets stored as the 2-byte UTF-8
encoding of the codepoint U+00B.  We reverse that here.
"""
import re, pathlib

FILE = pathlib.Path(r"c:\Users\Netcom\Vidyaportal\index.html")

text = FILE.read_text(encoding="utf-8")

# ── Strategy: try to decode every run of Latin-1-looking characters ──
# A mojibake run looks like  Ã¢â‚¬â€œ  (each char is U+00C0..U+00FF range
# or a few CP-1252 extras like â€ œ ™ etc.).
# We map each of those codepoints back to a single byte, then
# re-decode the resulting bytes as UTF-8.

# Build a mapping from the "mis-interpreted" Unicode codepoints
# back to the original bytes.  Windows-1252 is the usual culprit.
_cp1252_map = {}
for b in range(256):
    try:
        ch = bytes([b]).decode("cp1252")
        _cp1252_map[ch] = b
    except (UnicodeDecodeError, ValueError):
        pass

def _fix_mojibake(m: re.Match) -> str:
    """Try to reverse one mojibake run."""
    run = m.group(0)
    raw = bytearray()
    for ch in run:
        if ch in _cp1252_map:
            raw.append(_cp1252_map[ch])
        else:
            return run  # bail out – not real mojibake
    try:
        fixed = raw.decode("utf-8")
        # Sanity: the result should be *shorter* and contain no
        # control chars (except common whitespace).
        if len(fixed) < len(run) and all(
            c >= " " or c in "\t\n\r" for c in fixed
        ):
            return fixed
    except (UnicodeDecodeError, ValueError):
        pass
    return run  # leave unchanged if decode fails

# Regex: match runs of 2+ characters that are all in the
# "upper Latin-1 / CP-1252 extras" range.  These are the
# telltale sign of double-encoding.
# CP-1252 extras occupy U+0080-U+009F mapped positions and
# U+00A0-U+00FF.
_MOJIBAKE_RE = re.compile(
    r"[\u0080-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e"
    r"\u0192\u02c6\u02dc\u2013\u2014\u2018\u2019\u201a\u201c"
    r"\u201d\u201e\u2020\u2021\u2022\u2026\u2030\u2039\u203a"
    r"\u20ac\u2122]{2,}",
    re.UNICODE,
)

original = text
text = _MOJIBAKE_RE.sub(_fix_mojibake, text)

changed = text != original
FILE.write_text(text, encoding="utf-8")
print(f"Mojibake fix {'applied' if changed else 'no changes'}")

# Quick count of remaining suspect chars
remaining = len(_MOJIBAKE_RE.findall(text))
print(f"Remaining suspect runs: {remaining}")
