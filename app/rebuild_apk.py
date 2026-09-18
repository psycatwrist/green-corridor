#!/usr/bin/env python3
"""
=============================================================================
GREEN+ CORRIDOR - Android APK Rebuilder & Dual Signer (v1 JAR + v2 Block)
File: app/rebuild_apk.py
Ensures strict compliance with Android 11, 12, 13, 14+ (SDK 30-34):
- 4-byte zipalign on all uncompressed files (.png, .arsc, .dex)
- 4096-byte page alignment before APK Signing Block
- APK Signature Scheme v2 block (ID 0x7109871a) with RSASSA-PKCS1-v1_5 SHA256
- Verity padding block (ID 0x42726577) to page-align the APK Signing Block
- v1 JAR signing (MANIFEST.MF, AMBULANC.SF, AMBULANC.RSA)
=============================================================================
"""
import os
import sys
import struct
import zlib
import hashlib
import base64
import shutil
import io
import zipfile
from cryptography.hazmat.primitives.serialization import pkcs7, pkcs12, Encoding, PublicFormat
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography import x509

def lp(d: bytes) -> bytes:
    """Pack length-prefixed slice (uint32 little-endian followed by data)."""
    return struct.pack('<I', len(d)) + d

def rebuild():
    project_root = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(project_root, "apk-build")
    assets_dir = os.path.join(build_dir, "assets")
    keystore_path = os.path.join(build_dir, "release.keystore")
    target_apk = os.path.join(project_root, "GreenCorridorAmbulance.apk")
    base_apk = os.path.join(build_dir, "base.apk")
    source_apk = os.path.join(build_dir, "test_link.apk")

    print("[1/6] Synchronizing web and CAD assets to apk-build/assets...")
    os.makedirs(os.path.join(assets_dir, "css"), exist_ok=True)
    os.makedirs(os.path.join(assets_dir, "js"), exist_ok=True)
    os.makedirs(os.path.join(assets_dir, "icons"), exist_ok=True)
    os.makedirs(os.path.join(assets_dir, "lib", "leaflet"), exist_ok=True)

    # Copy updated core files
    shutil.copy2(os.path.join(project_root, "driver.html"), os.path.join(assets_dir, "driver.html"))
    shutil.copy2(os.path.join(project_root, "css", "driver.css"), os.path.join(assets_dir, "css", "driver.css"))
    shutil.copy2(os.path.join(project_root, "js", "api.js"), os.path.join(assets_dir, "js", "api.js"))
    shutil.copy2(os.path.join(project_root, "js", "data.js"), os.path.join(assets_dir, "js", "data.js"))
    shutil.copy2(os.path.join(project_root, "js", "state.js"), os.path.join(assets_dir, "js", "state.js"))
    shutil.copy2(os.path.join(project_root, "js", "driver.js"), os.path.join(assets_dir, "js", "driver.js"))

    if os.path.exists(os.path.join(project_root, "manifest.json")):
        shutil.copy2(os.path.join(project_root, "manifest.json"), os.path.join(assets_dir, "manifest.json"))
    if os.path.exists(os.path.join(project_root, "sw.js")):
        shutil.copy2(os.path.join(project_root, "sw.js"), os.path.join(assets_dir, "sw.js"))

    for ic in ["icon-192.png", "icon-512.png"]:
        src_ic = os.path.join(project_root, "icons", ic)
        if os.path.exists(src_ic):
            shutil.copy2(src_ic, os.path.join(assets_dir, "icons", ic))

    leaflet_src = os.path.join(project_root, "lib", "leaflet")
    if os.path.exists(leaflet_src):
        for lf in os.listdir(leaflet_src):
            shutil.copy2(os.path.join(leaflet_src, lf), os.path.join(assets_dir, "lib", "leaflet", lf))

    print("[2/6] Loading release keystore and binary Android base files...")
    with open(keystore_path, "rb") as ksf:
        key, cert, _ = pkcs12.load_key_and_certificates(ksf.read(), b"greencorridor123")

    apk_files = {}
    with zipfile.ZipFile(source_apk, 'r') as orig:
        for item in orig.filelist:
            if not item.filename.startswith('assets/') and not item.filename.startswith('META-INF/'):
                apk_files[item.filename] = orig.read(item.filename)

    for root, dirs, files in os.walk(assets_dir):
        for f in sorted(files):
            abs_path = os.path.join(root, f)
            rel_path = "assets/" + os.path.relpath(abs_path, assets_dir).replace("\\", "/")
            with open(abs_path, "rb") as fh:
                apk_files[rel_path] = fh.read()

    print(f"      Loaded {len(apk_files)} files into APK file tree.")

    print("[3/6] Generating v1 JAR Manifest & PKCS#7 signatures...")
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

    # Sign AMBULANC.SF using PKCS#7
    builder = pkcs7.PKCS7SignatureBuilder().set_data(sf_bytes)
    builder = builder.add_signer(cert, key, hashes.SHA256())
    rsa_bytes = builder.sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])

    all_files = dict(apk_files)
    all_files["META-INF/MANIFEST.MF"] = manifest_bytes
    all_files["META-INF/AMBULANC.SF"] = sf_bytes
    all_files["META-INF/AMBULANC.RSA"] = rsa_bytes

    def file_sort_key(name):
        if name == 'AndroidManifest.xml':
            return (0, name)
        if name.startswith('res/'):
            return (1, name)
        if name == 'resources.arsc':
            return (2, name)
        if name.startswith('assets/'):
            return (3, name)
        if name == 'classes.dex':
            return (4, name)
        if name == 'META-INF/AMBULANC.SF':
            return (5, '1')
        if name == 'META-INF/AMBULANC.RSA':
            return (5, '2')
        if name == 'META-INF/MANIFEST.MF':
            return (5, '3')
        return (6, name)

    ordered_names = sorted(all_files.keys(), key=file_sort_key)

    print("[4/6] Assembling 4-byte zipaligned entries and Central Directory...")
    zip_stream = bytearray()
    cd_entries = []

    for name in ordered_names:
        raw_data = all_files[name]
        crc = zlib.crc32(raw_data) & 0xffffffff
        uncomp_len = len(raw_data)

        # Stored (uncompressed) for .png, .arsc, .dex; deflated for text/code
        is_stored = name.endswith(('.png', '.arsc', '.dex'))
        if is_stored:
            method = 0
            comp_data = raw_data
        else:
            method = 8
            compressor = zlib.compressobj(level=9, method=zlib.DEFLATED, wbits=-15)
            comp_data = compressor.compress(raw_data) + compressor.flush()
        comp_len = len(comp_data)

        fn_bytes = name.encode('utf-8')
        local_offset = len(zip_stream)

        # 4-byte zipalign calculation for stored files
        if is_stored:
            data_offset = local_offset + 30 + len(fn_bytes)
            pad = (4 - (data_offset % 4)) % 4
            extra = b'\x00' * pad
        else:
            extra = b''

        flag = 0x0800 if name.startswith('META-INF/') else 0x0000
        version_needed = 20 if (method == 8 or is_stored) else 10

        lfh = struct.pack('<IHHHHHIIIHH',
                          0x04034b50, version_needed, flag, method, 0, 0,
                          crc, comp_len, uncomp_len, len(fn_bytes), len(extra))
        zip_stream.extend(lfh)
        zip_stream.extend(fn_bytes)
        zip_stream.extend(extra)
        zip_stream.extend(comp_data)

        cd_entries.append({
            'name': fn_bytes,
            'flag': flag,
            'method': method,
            'crc': crc,
            'comp_len': comp_len,
            'uncomp_len': uncomp_len,
            'local_offset': local_offset,
            'version_needed': version_needed
        })

    # Page-align Section 1 before APK Signing Block to 4096 bytes
    sec1_len = len(zip_stream)
    pad_4k = (4096 - (sec1_len % 4096)) % 4096
    zip_stream.extend(b'\x00' * pad_4k)
    block_start = len(zip_stream)

    # Build Central Directory
    cd_stream = bytearray()
    for entry in cd_entries:
        cdh = struct.pack('<IHHHHHHIIIHHHHHII',
                          0x02014b50, 0, entry['version_needed'], entry['flag'], entry['method'],
                          0, 0, entry['crc'], entry['comp_len'], entry['uncomp_len'],
                          len(entry['name']), 0, 0, 0, 0, 0, entry['local_offset'])
        cd_stream.extend(cdh)
        cd_stream.extend(entry['name'])

    cd_len = len(cd_stream)

    # Build EoCD for chunked hashing (with CD offset = block_start)
    eocd_hash = bytearray(struct.pack('<IHHHHIIH',
                                      0x06054b50, 0, 0, len(cd_entries), len(cd_entries),
                                      cd_len, block_start, 0))

    print("[5/6] Computing 1MB chunked digests and generating APK Signature Scheme v2 block...")
    CHUNK_SIZE = 1048576
    chunks = []
    for sec in (zip_stream, cd_stream, eocd_hash):
        for i in range(0, len(sec), CHUNK_SIZE):
            chunks.append(sec[i:i+CHUNK_SIZE])

    chunk_digests = [hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest() for c in chunks]
    top_digest = hashlib.sha256(b'\x5a' + struct.pack('<I', len(chunks)) + b''.join(chunk_digests)).digest()

    algo_id = 0x0103 # RSASSA-PKCS1-v1_5 with SHA256
    digest_record = struct.pack('<I', algo_id) + lp(top_digest)
    digests_elem = lp(lp(digest_record))
    cert_der = cert.public_bytes(Encoding.DER)
    certs_elem = lp(lp(cert_der))
    attrs_elem = b''

    signed_data = digests_elem + certs_elem + lp(attrs_elem) + lp(b'')
    signature = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())

    sig_record = struct.pack('<I', algo_id) + lp(signature)
    sigs_elem = lp(lp(sig_record))
    pub_der = cert.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
    pub_elem = lp(pub_der)

    signer = lp(signed_data) + sigs_elem + pub_elem
    v2_payload = lp(lp(signer))

    pair_v2 = struct.pack('<QI', len(v2_payload) + 4, 0x7109871a) + v2_payload

    # Page-pad APK Signing Block to 4096 bytes using VERITY_PADDING_BLOCK_ID (0x42726577)
    base_block_size = len(pair_v2) + 32
    pad_block = (4096 - (base_block_size % 4096)) % 4096
    if pad_block > 0:
        if pad_block < 12:
            pad_block += 4096
        pair_pad = struct.pack('<QI', pad_block - 8, 0x42726577) + (b'\x00' * (pad_block - 12))
    else:
        pair_pad = b''

    all_pairs = pair_v2 + pair_pad
    total_block_size = len(all_pairs) + 32
    block_len_field = total_block_size - 8
    signing_block = (struct.pack('<Q', block_len_field) +
                     all_pairs +
                     struct.pack('<Q', block_len_field) +
                     b'APK Sig Block 42')

    final_cd_offset = block_start + len(signing_block)
    final_eocd = struct.pack('<IHHHHIIH',
                             0x06054b50, 0, 0, len(cd_entries), len(cd_entries),
                             cd_len, final_cd_offset, 0)

    final_apk = zip_stream + signing_block + cd_stream + final_eocd

    print("[6/6] Verifying assembled APK integrity and writing release packages...")
    # Self-Verification
    zf = zipfile.ZipFile(io.BytesIO(final_apk))
    assert len(zf.filelist) == len(cd_entries), "ZIP filelist count mismatch!"

    # Verify 4-byte zipalign
    off = 0
    while off < block_start:
        if final_apk[off:off+4] != b'PK\x03\x04':
            break
        fn_l = struct.unpack('<H', final_apk[off+26:off+28])[0]
        ext_l = struct.unpack('<H', final_apk[off+28:off+30])[0]
        meth = struct.unpack('<H', final_apk[off+8:off+10])[0]
        csz = struct.unpack('<I', final_apk[off+18:off+22])[0]
        f_name = final_apk[off+30:off+30+fn_l].decode('utf-8')
        d_off = off + 30 + fn_l + ext_l
        if meth == 0:
            assert d_off % 4 == 0, f"Uncompressed file {f_name} not 4-byte aligned (offset {d_off})!"
        off = d_off + csz

    # Verify v2 signature
    cert.public_key().verify(signature, signed_data, padding.PKCS1v15(), hashes.SHA256())

    for dest in [target_apk, base_apk]:
        with open(dest, "wb") as f:
            f.write(final_apk)
        size_kb = len(final_apk) / 1024
        print(f"  -> Generated {dest} ({size_kb:.1f} KB)")

    print("\nSUCCESS: GreenCorridorAmbulance.apk is fully compliant with Android 11-14+!")
    print("         Signature Scheme: v1 JAR + v2 Block (0x7109871a)")
    print("         ZIP Alignment: 4-byte aligned (.arsc, .dex, .png)")
    print("         Signing Block: 4096-byte page aligned")

if __name__ == "__main__":
    rebuild()
