#!/usr/bin/env python3
"""Hängt an CSS-, JS- und Bildverweise in den HTML-Seiten einen Inhalts-Fingerabdruck (?v=…).

GitHub Pages lässt Browser Dateien zehn Minuten zwischenspeichern. Ohne Fingerabdruck
kann eine neue Seite mit einem alten Stylesheet zusammentreffen. Mit Fingerabdruck
ändert sich die Adresse jeder geänderten Datei, und der Browser lädt sie sofort neu.
Läuft automatisch vor jedem Commit (siehe .git/hooks/pre-commit).
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Schriften bleiben außen vor: Das Stylesheet lädt sie ohne Fingerabdruck,
# ein abweichender Preload-Link würde sie doppelt laden.
PATTERN = re.compile(r'((?:href|src)=")((?:css|js|assets)/[^"?#]+)(?:\?v=[0-9a-f]+)?(")')


def fingerprint(rel):
    path = ROOT / rel
    return hashlib.md5(path.read_bytes()).hexdigest()[:8] if path.is_file() else None


changed = []
for page in sorted(ROOT.glob("*.html")):
    text = page.read_text(encoding="utf-8")

    def stamp(m):
        v = fingerprint(m.group(2))
        return f"{m.group(1)}{m.group(2)}?v={v}{m.group(3)}" if v else m.group(0)

    new = PATTERN.sub(stamp, text)
    if new != text:
        page.write_text(new, encoding="utf-8")
        changed.append(page.name)

print("Fingerabdrücke aktualisiert:", ", ".join(changed) if changed else "keine Änderung")
