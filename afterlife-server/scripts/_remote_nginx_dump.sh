#!/usr/bin/env bash
# _remote_nginx_dump.sh — 가비아에서 root 로 실행 (ssh gabia 'bash -s' < 이 파일)
# nginx 활성 config 풀덤프 + include 파일/백업 파일 cat
set +e

echo "=========================================="
echo "  NGINX FULL ACTIVE CONFIG (nginx -T)"
echo "=========================================="
nginx -T 2>&1
echo ""

for f in \
  /etc/nginx/incTTS.conf \
  /etc/nginx/incMuseRTC.conf \
  /etc/nginx/incSadtalker.conf \
  /etc/nginx/nginx.conf.afterlife \
  /etc/nginx/nginx.conf.backup \
  /etc/nginx/sites-available/default
do
  echo ""
  echo "===== $f ====="
  if [[ -f "$f" ]]; then
    cat "$f"
  else
    echo "(not present)"
  fi
done

echo ""
echo "===== /etc/nginx ls ====="
ls -la /etc/nginx/

echo ""
echo "===== /etc/nginx/sites-available ls ====="
ls -la /etc/nginx/sites-available/ 2>/dev/null

echo ""
echo "===== /etc/nginx/snippets ls ====="
ls -la /etc/nginx/snippets/ 2>/dev/null
