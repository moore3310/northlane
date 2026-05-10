# Northlane Secure Banking

A Node.js web app with a banking-style dashboard, account history, transfers, card controls, bill payments, payee management, and server-backed session login.

## Run locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4173
```

## Login

```text
User ID: alex.morgan
Password: Northlane2026
```

## Deployment

The app uses only built-in Node.js modules and reads the hosting `PORT` environment variable automatically.

Start command:

```bash
npm start
```

## Files

- `server.js` - HTTP server, session auth, and JSON APIs
- `app.js` - browser-side UI logic
- `index.html` - app markup
- `styles.css` - app styling
- `data.json` - persisted local account/activity state
