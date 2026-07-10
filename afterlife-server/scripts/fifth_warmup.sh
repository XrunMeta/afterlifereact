#!/usr/bin/env bash
# fifth_warmup.sh — fifth 렌더러(도커 fifth_poc_flp, :8810) 시작 후 커널 워밍업 1회.
#
# 배경(T-120-j): TensorRT/CUDA 첫 추론이 콜드(~4965ms). 실측상 콜드는 렌더러
#   프로세스당 1회뿐(idle 재냉각 없음) → 시작 직후 무음 더미 렌더 1발이면
#   그날 첫 실통화 greet 부터 warm(~700ms). 컨테이너 코드 무수정(운영 훅).
#
# 사용: systemd oneshot(afterlife-fifth-warmup.service, After=docker.service) 또는
#   컨테이너 수동 재시작 후 `systemctl start afterlife-fifth-warmup.service`.
set -u

CTR="${FIFTH_CONTAINER:-fifth_poc_flp}"
SHARE="${FIFTH_SHARE_DIR:-/home/afterlife/afterlife-server/.fifth-tmp}"
WAV="$SHARE/warmup_probe.wav"
LOG="${FIFTH_WARMUP_LOG:-/data/afterlife/metrics/fifth/warmup.log}"
PY="$(command -v python3 || echo /usr/bin/python3)"

mkdir -p "$SHARE" "$(dirname "$LOG")" 2>/dev/null
ts() { date '+%Y-%m-%d %H:%M:%S'; }
say() { echo "[$(ts)] $*" >> "$LOG"; }

say "warmup 시작 (container=$CTR)"

# 0) 컨테이너 실행 확인 + 브릿지 IP 동적 해석 (재시작 시 IP 변동 대비).
if ! docker inspect "$CTR" >/dev/null 2>&1; then
  say "컨테이너 $CTR 없음 — skip"; exit 0
fi
IP="$(docker inspect "$CTR" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)"
[ -n "$IP" ] || { say "컨테이너 IP 해석 실패 — skip"; exit 0; }
URL="http://$IP:8810"

# 1) 8810 health 대기 (최대 120s). 안 뜨면 graceful skip(부팅 순서 안전장치).
code=""
for i in $(seq 1 60); do
  code="$(curl -s -m3 -o /dev/null -w '%{http_code}' "$URL/health" 2>/dev/null)"
  [ "$code" = "200" ] && break
  sleep 2
done
if [ "$code" != "200" ]; then
  say "8810 미기동(code=$code) — warmup skip"; exit 0
fi

# 2) 무음 프로브 wav 준비(공유 볼륨 → 컨테이너 동일 경로 가시). stdlib wave만 사용(numpy 불필요).
if [ ! -f "$WAV" ]; then
  "$PY" - "$WAV" <<'PY' 2>>"$LOG"
import sys, wave
p = sys.argv[1]
w = wave.open(p, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
w.writeframes(b"\x00\x00" * int(0.6 * 16000)); w.close()
PY
fi
[ -f "$WAV" ] || { say "무음 wav 생성 실패 — skip"; exit 0; }

# 3) 워밍업용 face(아무 클론 정면사진이나 무방 — 커널 워밍업은 클론 무관).
FACE="$(docker exec "$CTR" bash -lc 'ls /root/FasterLivePortrait/*-face.jpg 2>/dev/null | head -1' 2>/dev/null)"
if [ -z "$FACE" ]; then
  say "워밍업용 face jpg 미발견(/root/FasterLivePortrait/*-face.jpg) — skip"; exit 0
fi

# 4) 워밍업 렌더 1발. 콜드면 ~5s, warm이면 ~1s. 어느 쪽이든 이후 실통화는 warm.
res="$(curl -s -m 60 -o /dev/null -w '%{http_code} %{time_total}s' \
  -X POST "$URL/render" -H 'Content-Type: application/json' \
  -d "{\"wav_path\":\"$WAV\",\"video_path\":\"$FACE\"}" 2>>"$LOG")"
say "warmup 렌더 완료: HTTP $res (face=$FACE)"
exit 0
