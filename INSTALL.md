# Installing Ebiki (Windows)

## Steps

1. **Get the app** (skip if you have this folder):
   ```
   git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
   ```
   A GitHub ZIP works too: the installer links the folder to the project so it can update, and brings it to the latest release. Your settings, modes and decks are kept.
2. **Double-click `Install Ebiki.bat`** in the app folder (the only file you run) and leave its window open until it says it is finished.

The installer:

- Installs **Node.js** (18 or newer; an older one is upgraded) and **Git** with `winget` if missing.
- Installs **Anki** and its **AnkiConnect** add-on if missing. An existing AnkiConnect-style add-on (including forks like "Anki Connect Plus") is left alone.
- Runs `npm install`.
- Adds an **Ebiki** shortcut to the Desktop and Start Menu.

The app folder can live anywhere.

## Running the app

Double-click **Ebiki**. A start-up window shows what it is doing, then Ebiki opens as its own window or, if you chose it, a browser tab. Only one copy runs: if Ebiki is open, the shortcut brings it forward.

**Anki starts too**, minimized (the first time it opens normally so you can answer its setup questions). If an Anki update is available, the start-up window offers it first. "Anki is not connected" may show for a few seconds until Anki is ready. Keep Anki running while you use Ebiki.

To stop, close the Ebiki window; the background server shuts down shortly after. Ebiki does not start at login.

## Updates

Each launch checks for a newer version. If one exists, the start-up window asks **Update now** or **Not now** (Not now opens the app and asks again next launch). Offline, the app just opens.

**Settings → Data & updates** shows your version, checks for updates and offers **Restart now** to finish one.

## Backing up your cards (AnkiWeb)

Cards live in Anki on this computer; no account is needed. A free **AnkiWeb** account backs them up and lets you review on your phone; Ebiki offers it once, in a banner.

You sign in **inside Anki**: click **Sync** in Anki's toolbar and enter your AnkiWeb email and password. Ebiki never sees the password; its **Sign in inside Anki** button only brings Anki's window forward.

## Troubleshooting

- **AnkiConnect missing**: click **Install it for me** in Ebiki's banner, then restart Anki (add-ons load only at start-up). If Anki was open while the installer added AnkiConnect, restart Anki once.
- **Node installed but not found**: close the installer window and run `Install Ebiki.bat` again (a new window picks up the updated PATH). If the shortcut can't find Node, sign out and back in once.
- **No `winget`**: install Node.js LTS (https://nodejs.org) and Anki (https://apps.ankiweb.net) first, then run `Install Ebiki.bat`; it still adds AnkiConnect.
