# Secure Cloud Browser — Hugging Face Space image (browser host, free tier).
# One container runs everything: Chromium + KasmVNC (the browser, internal
# port 6901, never published) and gate.js (the token-gated orchestrator API
# + stream proxy on the Space port 7860). The browser profile lives in
# /profile and is synced to Supabase Storage by gate.js — the Space disk
# itself is ephemeral.
FROM debian:bookworm-slim

USER root
# KasmVNC is NOT published as a ready base image under
# "kasmvnc/kasmvnc-server" (that Docker Hub repo does not exist — verified
# 2026-10-22 during the Codespaces demo build). Install the official
# KasmVNC .deb for Debian Bookworm from the KasmVNC GitHub releases
# (asset URL verified live 2026-10-22, HTTP 200).
ARG KASMVNC_VERSION=1.5.0
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates \
    && curl -fsSL -o /tmp/kasmvncserver.deb \
      "https://github.com/kasmtech/KasmVNC/releases/download/v${KASMVNC_VERSION}/kasmvncserver_bookworm_${KASMVNC_VERSION}_amd64.deb" \
    && apt-get install -y --no-install-recommends /tmp/kasmvncserver.deb \
    && rm -f /tmp/kasmvncserver.deb \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium nodejs ca-certificates fonts-liberation openbox tar gzip \
    && rm -rf /var/lib/apt/lists/*

# Non-root browser user; /profile holds the persistent Chromium profile.
RUN useradd -m -s /bin/bash browser || true
ENV HOME=/home/browser
RUN mkdir -p /profile /home/browser/.vnc /app \
    && chown -R browser:browser /profile /home/browser

# KasmVNC session startup: a light window manager + Chromium pointed at the
# persistent profile directory.
RUN printf '%s\n' \
      '#!/bin/sh' \
      'unset SESSION_MANAGER' \
      'unset DBUS_SESSION_BUS_ADDRESS' \
      'openbox &' \
      'chromium --user-data-dir=/profile/chromium --no-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --start-maximized about:blank &' \
      'wait' \
      > /home/browser/.vnc/xstartup \
    && chmod +x /home/browser/.vnc/xstartup \
    && chown browser:browser /home/browser/.vnc/xstartup

COPY gate.js /app/gate.js
WORKDIR /app
EXPOSE 7860
CMD ["node", "gate.js"]
