#!/usr/bin/env bash
# Builds ~/Desktop/HoopSync.app: a thin, unsigned launcher that just opens a
# Terminal window running hoopsync.sh. NOT a packaged build of the apps
# themselves - see the product brief's "Dev -> prod transition" to-do for
# what a real electron-builder package would need first. Safe to re-run;
# rebuilds the icon and bundle from scratch each time.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$HOME/Desktop/HoopSync.app"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

command -v qlmanage >/dev/null || { echo "qlmanage not found (expected on macOS)." >&2; exit 1; }
command -v iconutil >/dev/null || { echo "iconutil not found (expected on macOS)." >&2; exit 1; }

echo "Rendering icon..."
qlmanage -t -s 1024 -o "$WORK" "$ROOT/resources/icon.svg" >/dev/null
mv "$WORK/icon.svg.png" "$WORK/icon.png"

mkdir -p "$WORK/HoopSync.iconset"
sips -z 16 16   "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_16x16.png" >/dev/null
sips -z 32 32   "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32   "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_32x32.png" >/dev/null
sips -z 64 64   "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_128x128.png" >/dev/null
sips -z 256 256 "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_256x256.png" >/dev/null
sips -z 512 512 "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$WORK/icon.png" --out "$WORK/HoopSync.iconset/icon_512x512.png" >/dev/null
cp "$WORK/icon.png" "$WORK/HoopSync.iconset/icon_512x512@2x.png"
iconutil -c icns "$WORK/HoopSync.iconset" -o "$WORK/AppIcon.icns"

echo "Building $APP..."
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$WORK/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>HoopSync</string>
  <key>CFBundleDisplayName</key>
  <string>HoopSync</string>
  <key>CFBundleIdentifier</key>
  <string>com.hoopsync.launcher</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleExecutable</key>
  <string>HoopSync</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon.icns</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.13</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
PLIST

cat > "$APP/Contents/MacOS/HoopSync" <<LAUNCHER
#!/bin/bash
osascript <<'APPLESCRIPT'
tell application "Terminal"
  activate
  do script "cd $ROOT && ./hoopsync.sh"
end tell
APPLESCRIPT
LAUNCHER
chmod +x "$APP/Contents/MacOS/HoopSync"
xattr -cr "$APP" 2>/dev/null || true

echo "Done: $APP"
