# Installing Ebiki (Windows)

A one-time setup that installs everything Ebiki needs and adds a Desktop shortcut.

## Steps

1. **Get the app** (skip if you have this folder):
   ```
   git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
   ```
   A GitHub ZIP works too: on first run the installer links the folder to the project so it can update, and moves it to the latest release. Your settings, modes and decks are kept.
2. **Double-click `Install Ebiki.bat`** in the app folder. It is the only file you run.

The installer:

- Installs **Node.js** and **Git** with Windows' `winget` if missing.
- Installs **Anki** and its **AnkiConnect** add-on if missing. Ebiki keeps every card in Anki, so Deck, Study and Discover need them. An existing AnkiConnect-style add-on (including forks like "Anki Connect Plus") is left alone.
- Runs **`npm install`**.
- Adds an **Ebiki** shortcut to the Desktop and Start Menu.

The app folder can live anywhere.

## Updates

Each time the **Ebiki** shortcut opens, it checks for a newer version:

- None, or offline: the app opens normally.
- Update available: the start-up window asks **Update now** or **Not now**. No opens the app; you're asked again next launch. The start-up window says what it is doing, so a slow start explains itself.

You can also update from **Settings → General → Updates**, which shows your version (e.g. `Ebiki 1.5.0`, with release date and build) and offers **Restart now** to finish an update.

A ZIP install becomes a normal Git checkout, so `git pull` works in that folder too.

## Backing up your cards (AnkiWeb)

Ebiki works without an account: cards live in Anki on this computer. A free **AnkiWeb** account backs them up and lets you review on your phone; Ebiki offers it once, in a banner.

You sign in **inside Anki**: click **Sync** in Anki's toolbar and enter your AnkiWeb email and password. Ebiki never sees the password; its **Sign in inside Anki** button only brings Anki's window forward.

If Ebiki says the **AnkiConnect add-on** is missing, click **Install it for me**, then restart Anki (add-ons load only at start-up).

## Running the app

Double-click **Ebiki**. A start-up window appears at once and says what it is doing, then Ebiki opens as its own window (no address bar or tabs, maximized; F11 for fullscreen) or, if you chose it, a browser tab. Change this per computer in Settings → General. Only one copy runs: if Ebiki is open, the shortcut brings it forward.

**Anki starts too**, minimized, because your cards live there (the first time it opens normally so you can answer its setup questions). If an Anki update is available, the start-up window offers it first. Ebiki may say "Anki is not connected" for a few seconds until Anki is ready. Keep Anki running while you use Ebiki.

To stop, close the Ebiki window; the background server shuts down shortly after.

## Notes

- The shortcut runs the dev server (`npm run dev`), which is also the app's backend (the `/api/...` endpoints), so it runs while you use the app.
- Ebiki does **not** start at login.
- If Anki was open while AnkiConnect was installed, restart Anki once.
- If the installer says Node was installed but not found, close the window and run `Install Ebiki.bat` again (a new window picks up the updated PATH).
- Without `winget`, install Node.js LTS (https://nodejs.org) and Anki (https://apps.ankiweb.net) first, then run `Install Ebiki.bat`; it still adds AnkiConnect.
- `scripts/` holds the setup and launcher scripts the installer and shortcut call; you never run them directly.
