# Rung by Rung

A calisthenics app for Push, Pull and Legs days. It shows a progression ladder for each exercise, keeps a session log, and tells you when to move up. It works offline, and everything you enter stays on your phone.

## Put it online (one time)

1. Sign in to github.com (or create a free account).
2. Click **+** at the top right, then **New repository**. Name it `rung-by-rung`, leave it **Public**, and click **Create repository**.
3. On the new repository's page, click **uploading an existing file**.
4. Drag in everything inside this folder: `index.html`, `app.js`, `data.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md`, and the `icons` and `fonts` folders. Click **Commit changes**.
5. Go to **Settings**, then **Pages**. Under "Branch", choose `main` and `/ (root)`, then click **Save**.
6. After a minute or two, the page shows your app's address: `https://YOUR-USERNAME.github.io/rung-by-rung/`.

## Install it on your Android phone

1. Open the address in **Chrome**.
2. Tap the **⋮** menu, then **Add to home screen**, then **Install**.
3. Open Rung by Rung from your home screen. It opens full screen and works without internet.

## Move your data from the Claude version

1. In the Claude version, scroll to the bottom of any day and tap **Backup and restore**, then **Copy backup text**.
2. In the phone app, tap **Backup and restore**, paste into the Restore box, and tap **Restore**, then **Replace**.

## Keep your data safe

Your levels and log live only on this phone. Use **Backup and restore → Save backup file** now and then. Always save a backup before you uninstall the app or clear Chrome's data.

## Updating the app later

Upload the changed files to the repository to replace the old ones. Change `VERSION` in `sw.js` (for example from `"v1"` to `"v2"`) so phones pick up the update. The new version appears the second time you open the app.
