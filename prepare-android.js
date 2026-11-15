// Adjusts the generated Android project for Calgoal: version number and dark splash/window colours.
// Usage: node prepare-android.js <buildNumber>
const fs = require("fs");
const path = require("path");

const build = Math.max(1, parseInt(process.argv[2] || "1", 10) || 1);
const root = path.join(__dirname, "android");
const BG = "#111415";

// Version: every build gets a higher number so Android accepts it as an update.
const gradleFile = path.join(root, "app", "build.gradle");
let gradle = fs.readFileSync(gradleFile, "utf8");
gradle = gradle.replace(/versionCode \d+/, `versionCode ${build}`).replace(/versionName "[^"]*"/, `versionName "1.${build}"`);
fs.writeFileSync(gradleFile, gradle);

// Colours: dark launch screen and dark window behind the app, so nothing flashes white.
const colorsFile = path.join(root, "app", "src", "main", "res", "values", "calgoal_colors.xml");
fs.writeFileSync(colorsFile, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="calgoal_bg">${BG}</color>
</resources>
`);
const stylesFile = path.join(root, "app", "src", "main", "res", "values", "styles.xml");
let styles = fs.readFileSync(stylesFile, "utf8");
styles = styles.replace(
  /(<style name="AppTheme\.NoActionBar"[^>]*>)/,
  `$1\n        <item name="android:windowBackground">@color/calgoal_bg</item>`
);
styles = styles.replace(
  /(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/,
  `$1\n        <item name="windowSplashScreenBackground">@color/calgoal_bg</item>\n        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`
);
fs.writeFileSync(stylesFile, styles);

console.log(`Calgoal Android project ready: version 1.${build} (code ${build}).`);
