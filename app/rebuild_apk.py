#!/usr/bin/env python3
"""
Green+ Corridor - Android APK Asset Synchronizer & Signer
Rebuilds GreenCorridorAmbulance.apk with latest driver.html, css/driver.css,
and js files, signed using the release keystore.
"""
import os
import io
import shutil
import zipfile
import hashlib
import base64
from cryptography.hazmat.primitives.serialization import pkcs7, pkcs12
from cryptography.hazmat.primitives import serialization, hashes

def rebuild():
    project_root = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(project_root, "apk-build")
    assets_dir = os.path.join(build_dir, "assets")
    keystore_path = os.path.join(build_dir, "release.keystore")
    target_apk = os.path.join(project_root, "GreenCorridorAmbulance.apk")
    base_apk = os.path.join(build_dir, "base.apk")

    # 1. Sync updated files to apk-build/assets
    print("[1/4] Syncing assets...")
    shutil.copy2(os.path.join(project_root, "driver.html"), os.path.join(assets_dir, "driver.html"))
    shutil.copy2(os.path.join(project_root, "css", "driver.css"), os.path.join(assets_dir, "css", "driver.css"))
    shutil.copy2(os.path.join(project_root, "js", "api.js"), os.path.join(assets_dir, "js", "api.js"))
    shutil.copy2(os.path.join(project_root, "js", "data.js"), os.path.join(assets_dir, "js", "data.js"))
    shutil.copy2(os.path.join(project_root, "js", "state.js"), os.path.join(assets_dir, "js", "state.js"))
    shutil.copy2(os.path.join(project_root, "js", "driver.js"), os.path.join(assets_dir, "js", "driver.js"))

    # 2. Collect all APK files (binary resources from existing APK + fresh assets)
    print("[2/4] Collecting APK file tree...")
    apk_files = {}
    with zipfile.ZipFile(target_apk, 'r') as orig:
        for item in orig.filelist:
            if not item.filename.startswith('assets/') and not item.filename.startswith('META-INF/'):
                apk_files[item.filename] = orig.read(item.filename)

    for root, dirs, files in os.walk(assets_dir):
        for f in sorted(files):
            abs_path = os.path.join(root, f)
            rel_path = "assets/" + os.path.relpath(abs_path, assets_dir).replace("\\", "/")
            with open(abs_path, "rb") as fh:
                apk_files[rel_path] = fh.read()

    # 3. Generate Manifest and Signature files (v1 JAR signing)
    print("[3/4] Generating cryptographic manifests and signing with release keystore...")
    sorted_filenames = sorted(apk_files.keys())

    manifest_lines = ["Manifest-Version: 1.0\r\n\r\n"]
    sf_entries = []

    for name in sorted_filenames:
        file_bytes = apk_files[name]
        digest = base64.b64encode(hashlib.sha256(file_bytes).digest()).decode("ascii")
        entry_str = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
        manifest_lines.append(entry_str)

        entry_bytes = entry_str.encode("utf-8")
        entry_digest = base64.b64encode(hashlib.sha256(entry_bytes).digest()).decode("ascii")
        sf_entries.append(f"Name: {name}\r\nSHA-256-Digest: {entry_digest}\r\n\r\n")

    manifest_bytes = "".join(manifest_lines).encode("utf-8")
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode("ascii")

    sf_header = f"Signature-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\nSHA-256-Digest-Manifest: {manifest_digest}\r\n\r\n"
    sf_bytes = (sf_header + "".join(sf_entries)).encode("utf-8")

    # Load release keystore
    with open(keystore_path, "rb") as ksf:
        key, cert, _ = pkcs12.load_key_and_certificates(ksf.read(), b"greencorridor123")

    # Sign AMBULANC.SF using PKCS#7
    builder = pkcs7.PKCS7SignatureBuilder().set_data(sf_bytes)
    builder = builder.add_signer(cert, key, hashes.SHA256())
    rsa_bytes = builder.sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])

    # 4. Write new APK
    print("[4/4] Assembling final signed APK...")
    for out_path in [target_apk, base_apk]:
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zout:
            # META-INF entries first
            zout.writestr("META-INF/MANIFEST.MF", manifest_bytes)
            zout.writestr("META-INF/AMBULANC.SF", sf_bytes)
            zout.writestr("META-INF/AMBULANC.RSA", rsa_bytes)
            
            # Other files
            for name in sorted_filenames:
                compress = zipfile.ZIP_STORED if name.endswith(('.png', '.arsc', '.dex')) else zipfile.ZIP_DEFLATED
                zout.writestr(name, apk_files[name], compress_type=compress)

        size_kb = os.path.getsize(out_path) / 1024
        print(f"  -> Successfully generated {out_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    rebuild()
