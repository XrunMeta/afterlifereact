#!/usr/bin/env bash
# _remote_legacy_inventory.sh — 회차 025 Phase 1
# Legacy / metahint 인프라 전수 인벤토리 (제거 전 매핑·백업 위해)
set +e

echo "===== 1) 모든 systemd 서비스 (의미 있는 것만) ====="
systemctl list-units --type=service --no-pager --no-legend --plain 2>/dev/null \
  | awk '{print $1, $3, $4}' \
  | grep -vE "^(systemd-|user@|cron|dbus|getty|networkd|resolved|logind|udev|polkit|ssh|nginx|cloudflared|fail2ban|unattended)" \
  | head -40

echo ""
echo "===== 2) afterlife / ollama / metahint 관련 unit 상세 ====="
for u in ollama ollama-afterlife afterlife-testbed; do
  echo "--- $u ---"
  systemctl is-enabled "$u".service 2>/dev/null
  systemctl is-active "$u".service 2>/dev/null
done
echo ""
echo "기타 legacy 추정 서비스 (musetalk/sadtalker/tts/aiortc/webrtc/chroma 패턴):"
ls /etc/systemd/system/ /lib/systemd/system/ /usr/lib/systemd/system/ 2>/dev/null \
  | grep -iE "musetalk|sadtalker|tts|aiortc|webrtc|chroma|metahint|wav2lip|liveport|sonic|chatterbox" \
  | sort -u | head -20

echo ""
echo "===== 3) nginx sites-enabled 전체 ====="
ls -la /etc/nginx/sites-enabled/
echo ""
echo "--- chat.metahint.ai conf 의 location 들 ---"
grep -nE "^\s*location\s|proxy_pass" /etc/nginx/sites-available/chat.metahint.ai 2>/dev/null \
  || grep -nE "^\s*location\s|proxy_pass" /etc/nginx/sites-available/default 2>/dev/null

echo ""
echo "===== 4) metahint nginx access_log 최근 1주치 endpoint 빈도 ====="
# 어떤 location 이 실제로 호출되는지 — 진짜 죽일 수 있는지 판단의 근거
LOG=/var/log/nginx/access.log
[[ -f "$LOG" ]] || LOG=$(ls /var/log/nginx/*access* 2>/dev/null | head -1)
echo "log file: $LOG"
if [[ -f "$LOG" ]]; then
  # 최근 1주 ≈ 7일분, 또는 file 내 전부
  awk '{print $7}' "$LOG" 2>/dev/null \
    | sed -E 's|^(/[^/?]*)/.*|\1/|; s|\?.*||' \
    | sort | uniq -c | sort -rn | head -25
fi
# rotate 된 것도
echo ""
echo "--- rotated logs 도 합산 (gz 포함) ---"
zcat /var/log/nginx/access.log.*.gz 2>/dev/null | awk '{print $7}' \
  | sed -E 's|^(/[^/?]*)/.*|\1/|; s|\?.*||' \
  | sort | uniq -c | sort -rn | head -15

echo ""
echo "===== 5) 8000~9000 대 listen 포트 + 프로세스 ====="
ss -ltnp 2>/dev/null | awk '$4 ~ /:(80[0-9][0-9]|81[0-9][0-9]|82[0-9][0-9]|83[0-9][0-9]|84[0-9][0-9]|85[0-9][0-9]|86[0-9][0-9]|87[0-9][0-9]|88[0-9][0-9]|89[0-9][0-9]|9[0-9][0-9][0-9]):/' | head -20

echo ""
echo "===== 6) 의심 디렉토리 크기 (modelweights 회수 후보) ====="
du -sh /opt 2>/dev/null
du -sh /opt/* 2>/dev/null | grep -iE "musetalk|sadtalker|tts|wav2lip|liveport|aiortc|webrtc|metahint|chatterbox|sonic" | head -15
echo "---"
du -sh /usr/share/* 2>/dev/null | grep -iE "musetalk|sadtalker|tts|wav2lip|metahint|ollama" | head -10
echo "---"
du -sh /home/* 2>/dev/null
echo "---"
du -sh /home/metahint 2>/dev/null
ls /home/metahint 2>/dev/null | head -20
echo "---"
du -sh /root/.cache /root/.cache/* 2>/dev/null | head -10

echo ""
echo "===== 7) conda / venv 환경 ====="
ls /opt/anaconda3/envs /opt/miniconda3/envs /home/metahint/miniconda3/envs /root/anaconda3/envs /root/miniconda3/envs 2>/dev/null | head -20
echo "---"
find / -maxdepth 5 -name "pyvenv.cfg" 2>/dev/null | head -10
echo "---"
ls /opt/*/venv /opt/*/env 2>/dev/null | head -10

echo ""
echo "===== 8) 디스크 여유 ====="
df -h / /home /data 2>/dev/null

echo ""
echo "===== 9) GPU 0 점유 프로세스 (legacy 가 아직 사용 중인지) ====="
nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv 2>/dev/null

echo ""
echo "===== DONE ====="
