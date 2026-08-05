# Installing Ebiki (Windows)

A one-time setup that installs everything the app needs and puts a launch shortcut on your Desktop.

## Steps

1. **Get the app** (skip if you already have this folder):
   ```
   git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
   ```
2. **Double-click `install.bat`** in the app folder.

That's it. The installer will:

- Install **Node.js** (the runtime the app needs) if it isn't already present, using Windows' built-in `winget`.
- Run **`npm install`** to set up the app's dependencies.
- Create an **"Ebiki" shortcut on your Desktop** (and in the Start Menu).

## Running the app

Double-click the **Ebiki** shortcut. It starts the app in the background and opens it at `http://localhost:3000`. It only ever runs one copy: if it's already running, the shortcut just opens the tab.

To stop it, close the browser tab and end the background `node` process (Task Manager), or just restart your computer.

## Notes

- The shortcut runs the app's dev server (`npm run dev`). That server also *is* the app's backend (all the `/api/...` endpoints), so it must stay running while you use the app. This is normal.
- The app does **not** start automatically at login. Double-click the shortcut when you want it.
- If `install.bat` says Node was installed but not found, close the window and run `install.bat` again (the freshly installed Node needs a new window to appear on PATH).
- If your Windows has no `winget`, install Node.js LTS from https://nodejs.org first, then run `install.bat`.
