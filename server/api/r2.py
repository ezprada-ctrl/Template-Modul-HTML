"""Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.

Kenapa paket Articulate pindah ke sini dari Supabase Storage:
  - Supabase paket GRATIS mematok 50MB per file, dan itu plafon yang gak bisa
    dinaikkan dari dashboard sama sekali (cuma bisa kalau upgrade berbayar).
    Paket Articulate 80-100MB mustahil masuk.
  - Kuota 1GB Supabase itu dipakai BARENGAN oleh semua modul (gambar, video,
    audio, semua). Tiap paket Articulate yang diupload menggerus jatah yang
    sama, dan kalau penuh SELURUH upload di aplikasi berhenti - bukan cuma
    fitur Articulate. R2 kasih 10GB gratis khusus buat ini, plus egress gratis.

Kenapa penandatanganan dikerjakan DI SINI, bukan di browser: kunci R2 itu
kunci penuh (baca+tulis+hapus) atas bucket. Kalau ditaruh di frontend, siapa
pun yang buka source bisa mengosongkan bucket. Jadi browser cuma minta URL
sementara ke endpoint ini; byte file besarnya tetap dikirim LANGSUNG dari
browser ke R2, gak numpang lewat backend - jadi gak ada batas ukuran request
yang kena.

Sengaja TANPA boto3: tanda tangan SigV4 cuma butuh hmac+hashlib dari pustaka
standar. boto3 nambah ~50MB ke image Render yang jatah memorinya kecil, buat
dipakai satu fungsi saja.
"""
import datetime
import hashlib
import hmac
import os
import urllib.parse

ALGORITHM = 'AWS4-HMAC-SHA256'
# R2 gak punya konsep region seperti AWS; 'auto' itu nilai yang diminta
# Cloudflare buat semua bucket.
REGION = 'auto'
SERVICE = 's3'


def is_configured():
    """Apakah kredensial R2 lengkap terpasang di environment backend?

    Dipakai frontend buat memutuskan jalur upload (R2 atau Supabase) SEBELUM
    pengguna kepalang milih file 100MB dan baru gagal di tengah jalan.
    """
    return all(os.environ.get(k) for k in (
        'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'))


def _creds():
    return (
        os.environ.get('R2_ACCOUNT_ID', ''),
        os.environ.get('R2_ACCESS_KEY_ID', ''),
        os.environ.get('R2_SECRET_ACCESS_KEY', ''),
        os.environ.get('R2_BUCKET', ''),
    )


def _quote(value, safe='/'):
    """Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI
    (safe='/') karena dia pemisah path, bukan bagian dari nama objek."""
    return urllib.parse.quote(value, safe=safe)


def _sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()


def _signing_key(secret, datestamp):
    k = _sign(('AWS4' + secret).encode('utf-8'), datestamp)
    k = _sign(k, REGION)
    k = _sign(k, SERVICE)
    return _sign(k, 'aws4_request')


def presign(method, key, expires=3600):
    """URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET'
    (unduh), atau 'DELETE' (hapus).

    UNSIGNED-PAYLOAD dipakai karena isi file gak pernah lewat sini - kita
    menandatangani IZIN-nya, bukan isinya. Tanpa ini browser harus menghitung
    SHA256 seluruh file 100MB di memori sebelum boleh mulai upload.
    """
    account_id, access_key, secret_key, bucket = _creds()
    if not all((account_id, access_key, secret_key, bucket)):
        raise RuntimeError('Kredensial R2 belum lengkap di environment backend.')

    host = f'{account_id}.r2.cloudflarestorage.com'
    canonical_uri = '/' + _quote(bucket) + '/' + _quote(key)

    now = datetime.datetime.now(datetime.timezone.utc)
    amzdate = now.strftime('%Y%m%dT%H%M%SZ')
    datestamp = now.strftime('%Y%m%d')
    scope = f'{datestamp}/{REGION}/{SERVICE}/aws4_request'

    params = {
        'X-Amz-Algorithm': ALGORITHM,
        'X-Amz-Credential': f'{access_key}/{scope}',
        'X-Amz-Date': amzdate,
        'X-Amz-Expires': str(int(expires)),
        'X-Amz-SignedHeaders': 'host',
    }
    # Query string HARUS urut secara byte, kalau enggak tanda tangannya beda
    # dari yang dihitung R2 dan hasilnya 403 yang membingungkan.
    canonical_query = '&'.join(
        f'{_quote(k, safe="")}={_quote(v, safe="")}' for k, v in sorted(params.items())
    )

    canonical_request = '\n'.join([
        method,
        canonical_uri,
        canonical_query,
        f'host:{host}\n',
        'host',
        'UNSIGNED-PAYLOAD',
    ])

    string_to_sign = '\n'.join([
        ALGORITHM,
        amzdate,
        scope,
        hashlib.sha256(canonical_request.encode('utf-8')).hexdigest(),
    ])

    signature = hmac.new(
        _signing_key(secret_key, datestamp),
        string_to_sign.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    return f'https://{host}{canonical_uri}?{canonical_query}&X-Amz-Signature={signature}'
