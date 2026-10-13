# GAMETIKA – kompletter Neuaufbau

## Enthalten
- `index.html`: Netlify-Frontend (im Repository-Hauptordner)
- `server.js`: Express-API für Render
- `package.json`: Startskript und Abhängigkeiten
- `public/media/` und `public/avatars/` werden beim Start automatisch erstellt

## Render-Konfiguration
- Root Directory: leer (Repository-Hauptordner)
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable `AUTH_SECRET`: zufälliger, geheimer Wert mit mindestens 32 Zeichen
- Optional Admin: `ADMIN_USERNAME` und `ADMIN_PASSWORD` (mindestens 12 Zeichen)

## Netlify-Konfiguration
- Publish directory: `.`
- Base directory: leer
- Netlify muss die Datei `index.html` aus dem Repository-Hauptordner veröffentlichen.

## Wichtige Hinweise
- Frontend-API-Adresse steht oben in `index.html` in `API_BASE`.
- `server.js` erlaubt aktuell als Frontend-Origin `https://gametikavision.netlify.app`.
- Dieses Projekt verwendet Token-Authentifizierung statt Cross-Site-Session-Cookies.
- Render-Dateisysteme im kostenlosen Tarif können temporär sein. Für dauerhafte Nutzer/Uploads ist eine persistente Datenbank und ein persistenter Dateispeicher erforderlich.
- Zahlungen werden nicht ausgelöst; Premium ist nur als UI-Bereich dargestellt.
