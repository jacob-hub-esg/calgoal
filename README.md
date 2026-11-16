# Calgoal

A calisthenics app for Push, Pull and Legs days (or your own training days). It shows a progression ladder for each exercise, walks you through each workout, keeps a session log with charts and a training calendar, and tells you when to move up. It works offline, and everything you enter stays on your phone.

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
3. Open Calgoal from your home screen. It opens full screen and works without internet.

## Install it on an iPhone

1. Open the address in **Safari**.
2. Tap the **Share** button (the square with an arrow), scroll down and tap **Add to Home Screen**, then **Add**.
3. Open Calgoal from your home screen. It opens full screen and works without internet.

Each phone keeps its own data. To copy it from one phone to another, use **Backup and data**.

## Move your data from the Claude version

1. In the Claude version, scroll to the bottom of any day and tap **Backup and restore**, then **Copy backup text**.
2. In the phone app, tap **Backup and data**, paste into the Restore box, and tap **Restore**, then **Replace**.

## Keep your data safe

Your levels and log live only on this phone. Use **Backup and data → Save backup file** now and then. Always save a backup before you uninstall the app or clear Chrome's data.

## Updating the app later

Upload the changed files to the repository to replace the old ones. Change `VERSION` in `sw.js` (for example from `"v1"` to `"v2"`) so phones pick up the update. The new version appears the second time you open the app.

## The Android app (Calgoal.apk)

The same repository also builds a real Android app with every file inside it, so it works without the website. GitHub builds it for you; nothing needs installing on a computer.

**One-time setup**

1. The repository needs these files in its main folder besides the web app: `package.json`, `package-lock.json`, `capacitor.config.json`, `prepare-android.js`, `android-icon.png`, `android-icon-foreground.png`, `android-icon-background.png` and `android-splash.png`. It also needs the build script at `.github/workflows/android.yml`. Create that one with **Add file → Create new file**, type the whole path as the name, and paste the script in.
2. Go to **Settings → Secrets and variables → Actions → New repository secret** and add two secrets:
   - `CALGOAL_KEYSTORE`: the long text from your signing-key file.
   - `CALGOAL_KEYSTORE_PASSWORD`: the password from the same file.

Keep the signing key and password somewhere safe, outside this repository. Every update must be signed with the same key. Without it, Android only installs a new version after you uninstall the old one, which deletes the app's data.

**Build and install**

1. Open the **Actions** tab, choose **Build Android app**, then **Run workflow**. It takes about 5–10 minutes.
2. Open the repository's **Releases** page on your phone and download **Calgoal.apk** from the newest release.
3. Open the file. Allow your browser or Files app to install apps when Android asks. If Play Protect warns that the developer is unknown, choose **Install anyway**.

The Android app keeps its own data, separate from the version installed from the website. Move it across with **Backup and data**. In the Android app, **Save backup file** opens Android's share menu, so you can keep the file in Drive, Files or email.

**Updating:** upload the changed files, run the workflow again, and install the new Calgoal.apk over the old one. Your data stays.
