#!/usr/bin/env bash
# _remote_firewall_ports.sh — 가비아에서 root 로 실행
# 방화벽 정책 + listening 포트 풀 덤프
set +e

echo "===== iptables -L -n -v ====="
iptables -L -n -v 2>&1 | head -120

echo ""
echo "===== iptables -t nat -L -n -v ====="
iptables -t nat -L -n -v 2>&1 | head -60

echo ""
echo "===== ip6tables -L -n -v ====="
ip6tables -L -n -v 2>&1 | head -40

echo ""
echo "===== ufw status verbose ====="
ufw status verbose 2>&1

echo ""
echo "===== firewalld active? ====="
systemctl is-active firewalld 2>&1
systemctl is-enabled firewalld 2>&1

echo ""
echo "===== nftables ruleset (head) ====="
nft list ruleset 2>&1 | head -80

echo ""
echo "===== ss -tlnp (TCP listen, ALL) ====="
ss -tlnp 2>&1

echo ""
echo "===== ss -ulnp (UDP listen, ALL) ====="
ss -ulnp 2>&1

echo ""
echo "===== /proc/sys/net/ipv4/ip_local_port_range ====="
cat /proc/sys/net/ipv4/ip_local_port_range
