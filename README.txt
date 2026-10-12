GAMETIK GAMING COMMUNITY — VERSION 2
================================================

Enthaltene Funktionen:
- Registrierung und Login (Passwörter werden mit bcrypt gehasht)
- Mitgliederprofile: Anzeigename, Kurz-Bio und Profilbild
- Freundschaftsanfragen und annehmen
- Öffentlicher Live-Chat
- Private Nachrichten zwischen Mitgliedern
- Upload von Videos, ZIP/7Z-Dateien und Bildern
- Videos direkt auf der Webseite abspielen
- Adminbereich zum Sperren von Mitgliedern und Löschen von Inhalten
- Sitzungen mit HTTP-only Cookie und SQLite-Session-Store

LOKAL AUF EINEM PC TESTEN
1. Node.js 18 oder neuer installieren: https://nodejs.org/
2. ZIP-Datei entpacken.
3. Terminal/Kommandozeile im entpackten Ordner öffnen.
4. `npm install` ausführen.
5. Admin-Zugangsdaten als Umgebungsvariablen setzen, bevor du startest:
   Linux/macOS:
     export ADMIN_USERNAME=deinadmin
     export ADMIN_PASSWORD='ein-sehr-langes-einzigartiges-passwort'
     export SESSION_SECRET='hier-einen-langen-zufaelligen-geheimtext-eintragen'
     npm start
   Windows PowerShell:
     $env:ADMIN_USERNAME="deinadmin"
     $env:ADMIN_PASSWORD="ein-sehr-langes-einzigartiges-passwort"
     $env:SESSION_SECRET="hier-einen-langen-zufaelligen-geheimtext-eintragen"
     npm start
6. Im Browser http://localhost:3000 öffnen.
7. Das Admin-Konto wird beim ersten Start angelegt, sofern ADMIN_PASSWORD mindestens 12 Zeichen hat.

ONLINE VERÖFFENTLICHEN
Diese Anwendung benötigt einen Node.js-Host, dauerhaften Speicher und HTTPS. Eine statische Netlify-Seite allein reicht nicht aus.
- Setze im Hosting-Dashboard ADMIN_USERNAME, ADMIN_PASSWORD und SESSION_SECRET als private Environment Variables.
- Verwende einen Host mit persistentem Dateisystem für `data/`, `public/media/` und `public/avatars/`. Ein flüchtiges Dateisystem führt zu Datenverlust.
- Die Anwendung legt Konten, Freundschaften und Nachrichten in `data/database.json` ab; Sitzungen in `data/sessions.sqlite`.
- Lege regelmäßige Backups an. Für eine größere öffentliche Community auf PostgreSQL und Objektspeicher migrieren.
- Vor öffentlichem Start sind zusätzliche Schutzmaßnahmen empfohlen: Rate-Limits, E-Mail-Verifizierung/Passwort-zurücksetzen, Moderation/Melden, Virenscan, Datenschutz/Impressum, Upload-Quotas, Alters-/Inhaltsregeln und belastbare Backups.
- Öffentliche Videos/Dateien sind über ihre URL erreichbar. Lade keine privaten Inhalte hoch und teile nur Dateien, an denen du Rechte hast.
- Nur Videos in Browser-kompatiblen Formaten wie MP4 (H.264/AAC) werden zuverlässig direkt abgespielt.

WICHTIG
Dies ist ein erweiterbarer Starter, keine fertig gehostete Website. Die Erstellung der Dateien veröffentlicht die Website nicht automatisch. Für einen öffentlichen Link müssen Server und Speicher bei einem Hosting-Anbieter eingerichtet werden.


GROSSE VIDEOS BIS 500 MB
======================
Der Upload-Limitwert ist auf 500 MB pro Datei erhöht. Damit dies online zuverlässig funktioniert, muss der Hosting-Anbieter:
- HTTP-Uploads bis mindestens 500 MB erlauben (inklusive Proxy-/Request-Limits und Timeouts),
- genügend dauerhaften Speicherplatz bereitstellen,
- ein persistentes Dateisystem für `public/media/` unterstützen,
- ausreichend Bandbreite und eine stabile Verbindung bieten.

Netlify ist für den Node.js-Server und große dauerhafte Video-Dateien allein nicht geeignet. Diese Website muss mit `server.js` auf einem Node.js-Host laufen. Die Dateien werden derzeit auf dem Server in `public/media/` gespeichert; dieser Speicher ist nur dauerhaft, wenn der gewählte Host persistente Festplatten unterstützt. Bei vielen Videos empfiehlt sich später ein Object-Storage-Dienst mit Multipart-Upload (z. B. S3-kompatibel), damit große Dateien sicherer und skalierbarer gespeichert werden können.

WICHTIG: Die Codeänderung erstellt noch keinen Online-Server und mietet keinen Speicherplatz automatisch. Der Server muss bei einem Hosting-Anbieter bereitgestellt und konfiguriert werden.


UPLOAD-LIMIT AKTUALISIERT: maximal 500 MB pro Datei.


GAMING-FEED-AKTIONEN: Videos unterstützen angemeldete Likes, Kommentare, Teilen per Geräte-Menü oder Link-Kopie sowie Download. Likes und Kommentare werden in der Anwendungsdatenbank gespeichert.

FOLLOW-FUNKTION: Mitglieder können anderen Mitgliedern folgen und entfolgen. Follower- und Following-Zahlen werden im Mitgliederbereich angezeigt.


ZAHLUNGEN (WICHTIG)
Die Zahlungsübersicht ist auf PayPal und eine spätere Banküberweisung an die Geschäftsbezeichnung Montenegro Reisen ausgerichtet. Telefónica/Handyrechnung wurde aus der aktuellen Planung entfernt. PayPal ist NICHT live integriert. Vor echtem Geldverkehr sind ein geeignetes PayPal-Geschäftskonto, serverseitiger Checkout, Webhooks, Transaktionsprotokoll und Rückerstattungslogik einzurichten. Die Banküberweisung bleibt deaktiviert, bis IBAN und ggf. BIC/SWIFT geprüft und ergänzt sind. Niemals Kartennummern als IBAN verwenden. Die geplante Spendenaufteilung von 70 % Plattform / 30 % Creator ist nur ein Konzept und benötigt vor Auszahlungen eine geeignete Zahlungs- und Abrechnungsintegration sowie Prüfung der geltenden Regeln. Keine PINs, Passwörter oder Kartenprüfcodes in der Webseite sammeln.


ARBEITSSTAND – ZAHLUNGSSEITE VORBEREITET
- Öffentliche Marke: GAMETIK, betrieben von Montenegro Reisen.
- PayPal-Zahlung und Banküberweisung sind als kommende Zahlungswege beschrieben, nicht live verbunden.
- Premium-Preis als Plan: 4,99 EUR/Monat.
- Video-Boosts und Creator-Unterstützung als geplante Funktionen.
- Geplante Aufteilung bei Creator-Unterstützung: 70 % Plattform / 30 % Creator; noch keine echten Auszahlungen.
- Für den Livebetrieb sind Händlerkonto, sichere Backend-Integration, Zahlungsbestätigungen, Rückerstattungen, Bedingungen und rechtliche Prüfung nötig.
