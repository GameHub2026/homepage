# Notizen: privatehomepagemitkigeschichte

Regeln: Nur diese Datei ändern, maximal 40 Zeilen, Veraltetes streichen. Dateien anderer Bereiche nicht anfassen.

## Erledigt
- Wrenfell läuft privat auf https://wrenfell.pages.dev (Cloudflare Pages, Passwortschutz per Pages Function).
- Tägliches Heft per Cloud-Routine (06:30 UTC): Kapitel KI, Gaming, Filme & Serien, Geschichte.
- Anhang mit Projekten (GameHub, Drop, Second Brain als Abbild, Kestrel öffentlich) und Regal.
- Regal "Spiele ich gerade" liest live aus GameHub (read-only D1-Binding), Fallback data/spiele.json.
- Deploy: GitHub Action ruft Cloudflare-Deploy-Hook bei jedem Push auf main.
- .wrenfell-passwort.txt auf Kevins Freigabe in den Papierkorb (Passwort liegt als Pages-Secret SITE_PASSWORD).

## Offen
- Heft 24 prüfen: erstes Film-Kapitel, Trailer-Quellen, Bilder, Zähler `film` im Index.
- Mobile Ansicht der Projektkarten und der Cover-Reihe ungeprüft.
- Kevin entscheidet: Passwort in 1Password sichern, Projekt aus iCloud nach ~/Projekte umziehen.
- Später: eigenes Hosting statt GameHub2026-Account, eigene Domain, GitHub-Repo privat.

## Entscheidungen
- Cloudflare Pages statt GitHub Pages – Seite soll privat bleiben.
- Deploy-Hook statt Git-Integration – Cloudflare-App hat keinen Zugriff auf das Repo.
- D1-Binding statt Access-Änderung bei GameHub – GameHub bleibt unverändert, Wrenfell liest nur einen Schlüssel.
- Cache 5 Minuten für /api/spiele – schont die Datenbank, Verzögerung ist vertretbar.
