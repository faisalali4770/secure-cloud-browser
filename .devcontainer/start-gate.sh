#!/usr/bin/env bash
# Runs on every Codespace start (wired as the devcontainer postStartCommand).
#
# Goal: after the Codespace wakes, the demo browser host (the gate
# container) comes back BY ITSELF, reusing the SAME container — so its
# environment, including the internal token, is unchanged and the website
# needs no settings update. If no gate container exists, this does nothing
# (first-time setup is a manual, assisted step).
set -u

# The docker-in-docker daemon starts at boot; wait for it briefly.
READY=0
for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then READY=1; break; fi
  sleep 2
done
if [ "$READY" != "1" ]; then
  echo "[gate-autostart] docker not ready; skipping"
  exit 0
fi

CID="$(docker ps -aq --filter name=scb-gate | head -n1)"
if [ -z "$CID" ]; then
  CID="$(docker ps -a --format '{{.ID}} {{.Image}}' | awk '$2 ~ /^scb-space/ {print $1; exit}')"
fi
if [ -z "$CID" ]; then
  echo "[gate-autostart] no gate container found; nothing to start"
  exit 0
fi

# Self-heal on future boots too, then start it now.
docker update --restart unless-stopped "$CID" >/dev/null 2>&1 || true
docker start "$CID" >/dev/null 2>&1 || true

for i in $(seq 1 45); do
  if curl -fsS http://localhost:7860/health >/dev/null 2>&1; then
    echo "[gate-autostart] gate is healthy on :7860"
    exit 0
  fi
  sleep 2
done
echo "[gate-autostart] gate did not answer health in time"
exit 0
