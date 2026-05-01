#!/usr/bin/env bash
# _remote_legacy_inventory_v2.sh — 회차 025 보충 인벤토리
# (1) GPU 점유 python 프로세스의 cmdline 확정
# (2) 수동 실행 (tmux/nohup) 흔적
# (3) 모든 listen 포트 + 프로세스 (패턴 버그 수정)
# (4) /data/TESTING, /root/miniconda3, /root/.cache 더 깊이
set +e

echo "===== 1) 모든 listen 포트 (단순 ss + 한번 더 정리) ====="
ss -ltnp 2>/dev/null | tail -n +2

echo ""
echo "===== 2) GPU 점유 python 프로세스 cmdline 정체 ====="
for pid in 480505 481082 481943; do
  echo "--- pid $pid ---"
  echo "cmd: $(tr '\0' ' ' < /proc/$pid/cmdline 2>/dev/null)"
  echo "cwd: $(readlink /proc/$pid/cwd 2>/dev/null)"
  echo "exe: $(readlink /proc/$pid/exe 2>/dev/null)"
  echo "uid: $(stat -c '%U' /proc/$pid 2>/dev/null)"
  echo "open ports?:"
  ss -ltnp 2>/dev/null | grep "pid=$pid"
done

echo ""
echo "===== 3) tmux 세션 (root + metahint) ====="
tmux ls 2>/dev/null
echo "---"
sudo -u metahint tmux ls 2>/dev/null
echo "---"
echo "다른 사용자 tmux?:"
ls /tmp/tmux-* 2>/dev/null

echo ""
echo "===== 4) python / node 프로세스 전체 (pid + cmdline 짧게) ====="
ps -eo pid,user,etime,cmd --no-headers 2>/dev/null \
  | awk '$4 ~ /python|uvicorn|gunicorn|node|conda|aiohttp|fastapi/' \
  | grep -vE "ollama|server\.js|afterlife-testbed" \
  | head -25

echo ""
echo "===== 5) /data/TESTING 트리 (legacy MuseTalk 위치 추정) ====="
ls -la /data/TESTING/ 2>/dev/null | head -20
echo "---"
du -sh /data/TESTING/* 2>/dev/null | head -10
echo "---"
echo "MuseTalk 디렉토리 구조 (depth 2):"
find /data/TESTING/MuseTalk -maxdepth 2 -type d 2>/dev/null | head -20

echo ""
echo "===== 6) /root/miniconda3/envs 상세 ====="
ls -la /root/miniconda3/envs/ 2>/dev/null
du -sh /root/miniconda3/envs/* 2>/dev/null

echo ""
echo "===== 7) /root/.cache 내용 (17GB의 정체) ====="
du -sh /root/.cache/* 2>/dev/null | sort -rh | head -10

echo ""
echo "===== 8) /home 사용자 전체 ====="
ls /home/ 2>/dev/null
echo "---"
du -sh /home/* 2>/dev/null

echo ""
echo "===== 9) chat.metahint.ai conf 의 location 별 라인번호 ====="
grep -nE "^\s*(location\s|server_name|proxy_pass)" /etc/nginx/sites-available/chat.metahint.ai 2>/dev/null \
  || grep -nE "^\s*(location\s|server_name|proxy_pass)" /etc/nginx/sites-available/default 2>/dev/null \
  | head -50

echo ""
echo "===== 10) 시스템 부팅 시 자동 실행되는 것 (cron, rc.local, systemd timers) ====="
crontab -l 2>/dev/null | head -10
echo "--- /etc/rc.local"
cat /etc/rc.local 2>/dev/null | head -20
echo "--- systemd timers"
systemctl list-timers --all --no-pager 2>/dev/null | head -10
echo "--- /etc/systemd/system/multi-user.target.wants/"
ls /etc/systemd/system/multi-user.target.wants/ 2>/dev/null

echo ""
echo "===== 11) metahint 사용자 ====="
id metahint 2>/dev/null
ls -la /home/metahint 2>/dev/null | head -10

echo ""
echo "===== DONE ====="
