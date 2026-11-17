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
- Heft 41 (2026-11-17) erschienen. Recherche am schnellsten über RSS-Feeds (heise, TechCrunch, Verge, Ars Technica, GamesIndustry.biz, Eurogamer, VGC, Deadline, THR, IndieWire, archaeology.org, livescience.com/feeds.xml) plus curl mit Browser-UA; WebSearch findet Tagesnews kaum. Geschichte ist oft dünn (am Wochenende besonders): zusätzlich finestresullarte.info (Volltext per WebFetch) und greekreporter.com (Artikel inzwischen per curl und WebFetch 403, nur RSS-Anriss); heritagedaily/phys.org/arkeonews-Feeds per curl nicht nutzbar. Live-Science-Artikeltext steht im RSS (content:encoded), nicht im HTML. Deadline-Feed mit ?paged=2,3 für mehr Meldungen. Greekreporter-Geschichtsartikel sind oft Neuauflagen alter Studien (Datum im og:image-Pfad prüfen). Live-Science-„Astonishing Artifacts“ sind Museumsstücke, keine News. archaeology.org nutzt bei manchen Meldungen ein Standardbild (ArchaeologyDefaultImage), dann archaeologymag-Artikel derselben Studie suchen. PC-Gamer-Text steht ab id="article-body". Deadline-URLs nie raten, immer aus dem Feed nehmen. archaeologymag.com liefert gute Querformat-Bilder und Volltext per curl. Deadline/THR-Volltext: Absätze mit <p class="paragraph …">. TechCrunch-og:image ist oft generisches Stockfoto (Fragezeichen o. Ä.), vorher ansehen; Bildcredit steht in figcaption. Quell-URLs nie raten, nur geöffnete Links eintragen (IndieWire-Slugs sind nicht vorhersagbar). Ars Technica gilt nicht als Filmquelle. IndieWire-Text per curl lesbar (alle <p> auswerten). Bildcredits bei Deadline/THR stehen als „Courtesy Everett Collection“ bzw. „… via Getty Images“ im HTML.
- Trailer-Links: YouTube-Embeds in Artikeln sind oft Fremdkanäle (JoBlo); Kanal per youtube.com/oembed prüfen, offiziellen Kanal über YouTube-Suche finden.
- Produktlogos als og:image (z. B. Project Helix bei VGC/Eurogamer) gelten als Logo, Meldung dann tauschen. PIL in der Umgebung defekt, Bildmaße per `file`.
- Bild-Fallback: anderen Artikel derselben Meldung nehmen (Wikimedia-API liefert oft kein JSON). heise-Startseiten-og ist Standardbild, Artikel-og ok. Guardian und Variety-Text per curl nicht lesbar, Deadline/THR/Eurogamer gut.
- Mit `git push origin HEAD:main` pushen (klappt auch, wenn der Checkout auf main steht).
- Mobile Ansicht der Projektkarten und der Cover-Reihe ungeprüft.
- Kevin entscheidet: Passwort in 1Password sichern, Projekt aus iCloud nach ~/Projekte umziehen.
- Später: eigenes Hosting statt GameHub2026-Account, eigene Domain, GitHub-Repo privat.

## Entscheidungen
- Cloudflare Pages statt GitHub Pages – Seite soll privat bleiben.
- Deploy-Hook statt Git-Integration – Cloudflare-App hat keinen Zugriff auf das Repo.
- D1-Binding statt Access-Änderung bei GameHub – GameHub bleibt unverändert, Wrenfell liest nur einen Schlüssel.
- Cache 5 Minuten für /api/spiele – schont die Datenbank, Verzögerung ist vertretbar.
