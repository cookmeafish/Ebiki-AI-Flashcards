# Installing Ebiki (Windows)

A one-time setup that installs everything the app needs and puts a launch shortcut on your Desktop.

## Steps

1. **Get the app** (skip if you already have this folder):
   ```
   git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
   ```
2. **Double-click `Install Ebiki.bat`** in the app folder.

That is the only file you run. Everything else in the folder belongs to the app.

The installer will:

- Install **Node.js** and **Git** (the prerequisites) if they aren't already present, using Windows' built-in `winget`.
- Install **Anki** and its **AnkiConnect** add-on if they aren't already there. Ebiki stores every card in Anki, so this is what makes the Deck, Study and Discover tabs work. If you already have an AnkiConnect-style add-on (including forks like "Anki Connect Plus"), it is left alone.
- Run **`npm install`** to set up the app's dependencies.
- Create an **"Ebiki" shortcut on your Desktop** (and in the Start Menu).

You can put the app folder anywhere you like; the installer and shortcut work from wherever it is.

## Updates

Opening the **Ebiki** shortcut does a quick check for a newer version:

- If none (or you're offline), the app just opens normally, seamlessly.
- If there's an update, it asks whether to install it. Choose **Yes** to update in place, or **No** to skip (it won't ask again for a week).

You can also update anytime from **Settings → General → Updates → Check for updates**. After an update, close and reopen the app (via the shortcut) to finish applying it.

## Running the app

Double-click the **Ebiki** shortcut. It starts the app in the background and opens it at `http://localhost:3000`. It only ever runs one copy: if it's already running, the shortcut just opens the tab.

**Anki starts with it.** The shortcut opens Anki minimized (only if it isn't already open), because that is where your cards live. Anki takes a few seconds to come up, so the app may briefly say "Anki is not connected"; it connects on its own as soon as Anki is ready. Leave Anki running while you use Ebiki.

To stop it, close the browser tab and end the background `node` process (Task Manager), or just restart your computer.

## Notes

- The shortcut runs the app's dev server (`npm run dev`). That server also *is* the app's backend (all the `/api/...` endpoints), so it must stay running while you use the app. This is normal.
- The app does **not** start automatically at login. Double-click the shortcut when you want it.
- If Anki was open while the installer added AnkiConnect, close and reopen Anki once so the add-on loads.
- If the installer says Node was installed but not found, close the window and run `Install Ebiki.bat` again (the freshly installed Node needs a new window to appear on PATH).
- If your Windows has no `winget`, install Node.js LTS from https://nodejs.org and Anki from https://apps.ankiweb.net first, then run `Install Ebiki.bat` (it will still add AnkiConnect for you).
- The `scripts/` folder holds the setup and launcher scripts the installer and the Desktop shortcut call. You never need to run those directly.
