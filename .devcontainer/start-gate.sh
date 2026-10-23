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

HEALTHY=0
for i in $(seq 1 45); do
  if curl -fsS http://localhost:7860/health >/dev/null 2>&1; then
    echo "[gate-autostart] gate is healthy on :7860"
    HEALTHY=1
    break
  fi
  sleep 2
done
if [ "$HEALTHY" != "1" ]; then
  echo "[gate-autostart] gate did not answer health in time"
fi

# The forwarded port reverts to Private on every start that no editor
# triggers (devcontainer portsAttributes is NOT honored on API wakes —
# proven 2026-10-24, even after a devcontainer rebuild). Flip it back to
# Public from inside the Codespace with the gh CLI. gh is NOT part of
# this devcontainer's base image, so fetch it once if missing — the
# install persists in the container across restarts, and this also
# self-heals after any future rebuild. Best effort throughout: if any
# of this fails, the host itself still works — only the public URL
# stays locked until someone opens the editor's Ports panel.
GH_BIN="$(command -v gh || true)"
if [ -z "$GH_BIN" ] && [ -n "${CODESPACE_NAME:-}" ]; then
  if curl -fsSL -o /tmp/gh.tar.gz "https://github.com/cli/cli/releases/download/v2.62.0/gh_2.62.0_linux_amd64.tar.gz" 2>/dev/null; then
    mkdir -p "$HOME/.local/bin"
    if tar -xzf /tmp/gh.tar.gz -C /tmp 2>/dev/null && cp /tmp/gh_2.62.0_linux_amd64/bin/gh "$HOME/.local/bin/gh" 2>/dev/null; then
      chmod +x "$HOME/.local/bin/gh"
      GH_BIN="$HOME/.local/bin/gh"
      echo "[gate-autostart] gh CLI installed to ~/.local/bin"
    fi
    rm -f /tmp/gh.tar.gz
  fi
fi
if [ -n "$GH_BIN" ] && [ -n "${CODESPACE_NAME:-}" ]; then
  for i in $(seq 1 10); do
    if "$GH_BIN" codespace ports visibility 7860:public -c "$CODESPACE_NAME" >/dev/null 2>&1; then
      echo "[gate-autostart] port 7860 visibility set to public via gh"
      break
    fi
    sleep 3
  done
fi
exit 0
