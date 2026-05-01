#!/usr/bin/env bash
# _local_portscan.sh — 로컬에서 가비아 외부 도달 가능한 TCP 포트 스캔
# nmap 있으면 nmap, 없으면 nc -z 폴백
set +e

HOST=121.254.172.32
PORTS="22 80 443 3000 3001 3443 4000 5000 5173 7000 7080 7443 7851 8000 8001 8010 8011 8012 8080 8081 8082 8083 8084 8085 8443 8765 8090 9000 9001 9443 11434"

echo "scan target : $HOST"
echo "ports       : $PORTS"
echo "started_at  : $(date -Iseconds)"
echo ""

if command -v nmap >/dev/null 2>&1; then
  echo "===== nmap -Pn ====="
  nmap -Pn -p "$(echo $PORTS | tr ' ' ',')" "$HOST"
else
  echo "(nmap not installed; using nc -z -w 2)"
  echo "===== nc -z -w 2 $HOST ====="
  for p in $PORTS; do
    if nc -z -w 2 "$HOST" "$p" 2>/dev/null; then
      echo "OPEN     : $p"
    else
      echo "FILTERED : $p"
    fi
  done
fi

echo ""
echo "finished_at : $(date -Iseconds)"
