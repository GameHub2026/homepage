# Notizen: privatehomepagemitkigeschichte

Regeln: Nur diese Datei ändern, maximal 40 Zeilen, Veraltetes streichen. Dateien anderer Bereiche nicht anfassen.

## Erledigt
- Wrenfell läuft privat auf https://wrenfell.pages.dev (Cloudflare Pages, Passwortschutz per Pages Function).
- Tägliches Heft per Cloud-Routine (06:30 UTC): Kapitel KI, Gaming, Filme & Serien, Geschichte.
- Anhang mit Projekten (GameHub, Drop, Second Brain als Abbild, Kestrel öffentlich) und Regal.
- Regal "Spiele ich gerade" liest live aus GameHub (read-only D1-Binding), Fallback data/spiele.json.
- Deploy: GitHub Action ruft Cloudflare-Deploy-Hook bei jedem Push auf main.
- .wrenfell-passwort.txt auf Kevins Freigabe in den Papierkorb (Passwort liegt als Pages-Secret SITE_PASSWORD).
- Heft 49 (2026-11-26) erschienen (am 25.11. lief keine Ausgabe).

## Offen
- Mobile Ansicht der Projektkarten und der Cover-Reihe ungeprüft.
- Kevin entscheidet: Passwort in 1Password sichern, Projekt aus iCloud nach ~/Projekte umziehen.

## Hinweise
- Pushen mit `git push origin HEAD:main` (klappt auch, wenn der Checkout auf main steht).
- Recherche am schnellsten über RSS-Feeds (heise, TechCrunch, Verge, Ars Technica, GamesIndustry.biz, Eurogamer, VGC, Deadline, THR, IndieWire, archaeology.org, livescience.com/feeds.xml) plus curl mit Browser-UA; WebSearch findet Tagesnews kaum. Feed-URLs beim Auslesen nie mit cut kürzen (abgeschnittene Links laufen ins 404). Deadline-Feed mit ?paged=2,3 für mehr Meldungen.
- Quellen: Quell-URLs nie raten, nur geöffnete Links eintragen (Deadline immer aus dem Feed, IndieWire-Slugs nicht vorhersagbar). Ars Technica und heise gelten nicht als Filmquelle. Panem lief schon 3× als „Neu zu“, nur bei echtem Neuigkeitswert wieder.
- Volltext: Deadline/THR/Eurogamer gut (Absätze `<p class="paragraph …">`), IndieWire per curl lesbar (teils keine <p>: ab erstem Satz des Fließtexts Tags entfernen), PC Gamer ab id="article-body", archaeologymag.com per curl. Guardian und Variety per curl nicht lesbar.
- Geschichte ist oft dünn (am Wochenende besonders): zusätzlich finestresullarte.info (Volltext per WebFetch; rss.php ist 404). Greekreporter liefert per curl nur eine 5-KB-Sperrseite, per WebFetch 403, nur RSS-Anriss; Geschichtsartikel dort oft Neuauflagen alter Studien (Datum im og:image-Pfad prüfen). heritagedaily/phys.org/arkeonews-Feeds per curl nicht nutzbar.
- Live Science: Artikeltext steht im Feed unter <content:encoded …> (mit Attributen), nicht im HTML; Bildcredit in <media:credit>, sonst oft unklar (dann „Live Science“). og:image per HTML-Abruf ok. „Astonishing Artifacts“ sind Museumsstücke, keine News.
- Bildquellen meiden: Produktlogos als og:image (Project Helix bei VGC/Eurogamer, PS Store bei VGC, IWGB/Unity-Synty bei GI) gelten als Logo, Meldung dann tauschen. TechCrunch-og oft Stockfoto oder App-Icon (z. B. Claude-Logo), vorher ansehen; dann Bilder im Artikel (wp-content/uploads/…png, nur mit Browser-UA). Verge-og mit „STK“ im Dateinamen = Stock-Illustration. Deadline-og mit „logo“ im Dateinamen meiden, IndieWire-Bild derselben Meldung nehmen. heise-Startseiten-og ist Standardbild, Artikel-og ok. archaeology.org nutzt teils ArchaeologyDefaultImage, dann archaeologymag-Artikel derselben Studie suchen. Ars-Tidal-og war Logo auf Handy.
- Bildquellen gut: archaeologymag.com liefert gute Querformat-Bilder. Fallback: anderen Artikel derselben Meldung nehmen oder Openverse-API (mit &aspect_ratio=wide, Commons-Thumb per /thumb/…/1280px-Datei; Flickr). Wikimedia-API antwortet oft mit Rate-Limit-Text statt JSON.
- Bildcredits: Deadline/THR als „Courtesy Everett Collection“ bzw. „… via Getty Images“ im HTML, TechCrunch in figcaption. PIL in der Umgebung defekt, Bildmaße per `file`.
- Trailer-Links: YouTube-Embeds in Artikeln sind oft Fremdkanäle (JoBlo); Kanal per youtube.com/oembed prüfen, offiziellen Kanal über YouTube-Suche finden.
- Texte: Highlight nie mit öffnendem „ beginnen lassen, wenn im Body davor ein Satzteil steht.

## Entscheidungen
- Cloudflare Pages statt GitHub Pages – Seite soll privat bleiben.
- Deploy-Hook statt Git-Integration – Cloudflare-App hat keinen Zugriff auf das Repo.
- D1-Binding statt Access-Änderung bei GameHub – GameHub bleibt unverändert, Wrenfell liest nur einen Schlüssel.
- Cache 5 Minuten für /api/spiele – schont die Datenbank, Verzögerung ist vertretbar.
- Idee für irgendwann: eigenes Hosting statt GameHub2026-Account, eigene Domain, GitHub-Repo privat.
