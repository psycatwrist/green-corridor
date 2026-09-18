#!/usr/bin/env bash
# ==============================================================================
# Green+ Corridor - 1-Click Android APK Rebuild Script
# Automatically packages driver.html, css/driver.css, and js files into
# GreenCorridorAmbulance.apk with Android 14 (Target SDK 34) & v2/v3 signatures.
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_ROOT/apk-build"

echo "========================================================"
echo "  REBUILDING GREEN+ CORRIDOR AMBULANCE DRIVER APK"
echo "========================================================"

# 1. Sync updated web assets to apk-build/assets/
echo "[1/5] Syncing driver.html, css/driver.css, and js files..."
mkdir -p "$BUILD_DIR/assets/css" "$BUILD_DIR/assets/js" "$BUILD_DIR/assets/lib/leaflet" "$BUILD_DIR/assets/icons"
cp "$PROJECT_ROOT/driver.html" "$BUILD_DIR/assets/"
cp "$PROJECT_ROOT/css/driver.css" "$BUILD_DIR/assets/css/"
cp "$PROJECT_ROOT/js/driver.js" "$BUILD_DIR/assets/js/"
cp "$PROJECT_ROOT/js/api.js" "$BUILD_DIR/assets/js/"
cp "$PROJECT_ROOT/js/data.js" "$BUILD_DIR/assets/js/"
cp "$PROJECT_ROOT/js/state.js" "$BUILD_DIR/assets/js/"
cp "$PROJECT_ROOT/manifest.json" "$BUILD_DIR/assets/"
cp "$PROJECT_ROOT/sw.js" "$BUILD_DIR/assets/"
cp -r "$PROJECT_ROOT/lib/leaflet/"* "$BUILD_DIR/assets/lib/leaflet/"
cp -r "$PROJECT_ROOT/icons/"* "$BUILD_DIR/assets/icons/"

# 2. Compile Android resources
echo "[2/5] Compiling resources with AAPT2..."
cd "$BUILD_DIR"
./aapt2 compile --dir res -o compiled_res/res.zip

# 3. Link APK with AAPT2 targeting Android 14 (SDK 34)
echo "[3/5] Linking base APK..."
./aapt2 link -o base.apk -I android.jar --manifest AndroidManifest.xml -A assets/ compiled_res/res.zip --auto-add-overlay

# 4. Insert classes.dex bytecode
echo "[4/5] Injecting classes.dex..."
python3 -c "
import zipfile
with zipfile.ZipFile('base.apk', 'a') as z:
    z.write('bin/classes.dex', 'classes.dex')
"

# 5. ZipAlign and Sign with v1, v2, and v3 schemes
echo "[5/5] ZipAligning and signing with release keystore (v2/v3)..."
java -jar uber-apk-signer.jar -a base.apk \
  --ks release.keystore \
  --ksAlias ambulance \
  --ksPass greencorridor123 \
  --ksKeyPass greencorridor123 \
  --allowResign \
  --overwrite \
  --verbose > /dev/null

cp base.apk "$PROJECT_ROOT/GreenCorridorAmbulance.apk"

APK_SIZE=$(ls -lh "$PROJECT_ROOT/GreenCorridorAmbulance.apk" | awk '{print $5}')
echo ""
echo "========================================================"
echo "  BUILD SUCCESSFUL!"
echo "  New APK ready: $PROJECT_ROOT/GreenCorridorAmbulance.apk"
echo "  File Size: $APK_SIZE"
echo "  Android Target: SDK 34 (Android 14) • v2/v3 Signed"
echo "========================================================"
