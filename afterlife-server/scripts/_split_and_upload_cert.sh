#!/usr/bin/env bash
# _split_and_upload_cert.sh — Cloudflare Origin Cert 분리 + 검증 + 가비아 전송
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$REPO_ROOT/afterlife-server/configs/afterlifesslkey.txt"
PEM="$REPO_ROOT/afterlife-server/configs/memorial.example.invalid.pem"
KEY="$REPO_ROOT/afterlife-server/configs/memorial.example.invalid.key"

[[ -f "$SRC" ]] || { echo "[error] $SRC not found"; exit 2; }

echo "===== split cert / key ====="
awk '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/' "$SRC" > "$PEM"
awk '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/' "$SRC" > "$KEY"
chmod 600 "$KEY"; chmod 644 "$PEM"
echo "PEM lines: $(wc -l < "$PEM")  /  KEY lines: $(wc -l < "$KEY")"

echo ""
echo "===== cert subject / issuer / dates ====="
openssl x509 -in "$PEM" -noout -subject -issuer -dates

echo ""
echo "===== cert SAN ====="
openssl x509 -in "$PEM" -noout -ext subjectAltName 2>/dev/null \
  || openssl x509 -in "$PEM" -noout -text | grep -A 2 "Subject Alternative Name"

echo ""
echo "===== key validate ====="
openssl rsa -in "$KEY" -check -noout 2>&1 | head -5

echo ""
echo "===== modulus pair check ====="
CERT_MOD=$(openssl x509 -in "$PEM" -noout -modulus | openssl md5)
KEY_MOD=$(openssl rsa -in "$KEY" -noout -modulus 2>/dev/null | openssl md5)
echo "cert: $CERT_MOD"
echo "key : $KEY_MOD"
[[ "$CERT_MOD" == "$KEY_MOD" ]] || { echo "[ERROR] modulus mismatch"; exit 3; }
echo "[OK] cert/key pair matched"

echo ""
echo "===== upload to gabia (/etc/ssl/cloudflare/) ====="
ssh -o BatchMode=yes gabia "mkdir -p /etc/ssl/cloudflare && chmod 755 /etc/ssl/cloudflare"
scp -o BatchMode=yes -q "$PEM" "$KEY" gabia:/etc/ssl/cloudflare/
ssh -o BatchMode=yes gabia 'chmod 644 /etc/ssl/cloudflare/memorial.example.invalid.pem; chmod 600 /etc/ssl/cloudflare/memorial.example.invalid.key; chown root:root /etc/ssl/cloudflare/memorial.example.invalid.*; ls -la /etc/ssl/cloudflare/'

echo ""
echo "===== DONE ====="
