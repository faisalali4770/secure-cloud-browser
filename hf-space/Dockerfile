# Secure Cloud Browser — Hugging Face Space image (browser host, free tier).
# One container runs everything: Chromium + KasmVNC (the browser, internal
# port 6901, never published) and gate.js (the token-gated orchestrator API
# + stream proxy on the Space port 7860). The browser profile lives in
# /profile and is synced to Supabase Storage by gate.js — the Space disk
# itself is ephemeral.
FROM kasmvnc/kasmvnc-server:bookworm

USER root
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
