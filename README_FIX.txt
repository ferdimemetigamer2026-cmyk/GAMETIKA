# GAMETIKA – korrigierte Verbindung

## Fehler, die korrigiert wurden
- Frontend-API-Adresse: `https://gameti.onrender.com` (vorher falsche Adresse `https://gametika.onrender.com`).
- CORS erlaubt jetzt auch den veröffentlichten Frontend-Origin `https://gametikavideo.netlify.app`.

## Dateien hochladen
1. GitHub-Repository `ferdimemetigamer2026-cmyk/GAMETIKA` öffnen und sicherstellen, dass der Branch `main` ausgewählt ist.
2. `index.html` im Hauptverzeichnis durch die Datei aus diesem Paket ersetzen und committen. Netlify muss danach neu deployen.
3. `server.js` im Hauptverzeichnis durch die Datei aus diesem Paket ersetzen und committen. Render muss danach neu deployen.
4. `package.json` nur ersetzen, wenn das aktuelle Paket nicht bereits dieselben Startskripte und Abhängigkeiten enthält.
5. Auf Render muss Root Directory leer, Build Command `npm install`, Start Command `npm start` sein.

## Tests
- `node --check server.js` wurde erfolgreich ausgeführt.
- API-URL und CORS-Origin wurden im Code geprüft.
- Nach dem Deployment die Registrierung testen. Die JSON-Startseite allein testet CORS und Registrierung nicht.

Hinweis: Render Free verwendet ohne persistente Datenbank temporären Speicher. Für dauerhafte Konten/Videos später eine persistente Datenbank und Dateispeicherung einrichten.
