# Installing Ebiki (Windows)

A one-time setup that installs everything the app needs and puts a launch shortcut on your Desktop.

## Steps

1. **Get the app** (skip if you already have this folder):
   ```
   git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
   ```
   Downloading the ZIP from GitHub works too. A ZIP normally can't update itself, so the installer links the folder to the project on first run and updates it to the latest release. Your settings, modes and decks are left alone.
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
- If there's an update, the start-up window asks right there: **Update now** or **Not now**. It checks every single time you open the shortcut, so saying no just opens the app and you'll be asked again next time. The start-up window also tells you what it's doing while it works, so a longer start says why.

If you skip it, or walk away and the question times out, the app itself shows an **update banner** across the top once it opens, with **Update now**. **Later** hides it for a few hours, not forever, so an update never goes unnoticed. After updating, use **Restart now** in the banner (or close and reopen the shortcut) to finish applying it.

You can also update anytime from **Settings → General → Updates**, which shows which version you're on.

## Backing up your cards (AnkiWeb)

Ebiki works straight away without an account: your cards live in Anki on this computer. A free
**AnkiWeb** account backs them up and lets you review on your phone, so Ebiki offers it once with a
banner across the top of the app.

You sign in **inside Anki**, not in Ebiki: click **Sync** in Anki's toolbar and enter your AnkiWeb
email and password there. Ebiki never sees that password. Its "Sign in inside Anki" button only
brings the Anki window to the front for you.

If Ebiki says the **AnkiConnect add-on** is missing, use the **Install it for me** button on that
notice, then close Anki and open it again. (Add-ons only load when Anki starts.)

## Running the app

Double-click the **Ebiki** shortcut. It starts the app in the background and opens it as its own window - not a browser tab: no address bar, no tab strip, its own taskbar icon, maximized (so your taskbar stays visible; press F11 for true fullscreen). It only ever runs one copy: if it's already running, the shortcut just brings that window to the front.

**Anki starts with it**, in a normal (not minimized) window so you can see it came up, because that is where your cards live. Anki takes a few seconds to come up, so the app may briefly say "Anki is not connected"; it connects on its own as soon as Anki is ready. Leave Anki running while you use Ebiki.

To stop it, close the Ebiki window and end the background `node` process (Task Manager), or just restart your computer.

## Notes

- The shortcut runs the app's dev server (`npm run dev`). That server also *is* the app's backend (all the `/api/...` endpoints), so it must stay running while you use the app. This is normal.
- The app does **not** start automatically at login. Double-click the shortcut when you want it.
- If Anki was open while the installer added AnkiConnect, close and reopen Anki once so the add-on loads.
- If the installer says Node was installed but not found, close the window and run `Install Ebiki.bat` again (the freshly installed Node needs a new window to appear on PATH).
- If your Windows has no `winget`, install Node.js LTS from https://nodejs.org and Anki from https://apps.ankiweb.net first, then run `Install Ebiki.bat` (it will still add AnkiConnect for you).
- The `scripts/` folder holds the setup and launcher scripts the installer and the Desktop shortcut call. You never need to run those directly.
