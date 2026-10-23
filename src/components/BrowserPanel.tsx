"use client";
import { useCallback, useEffect, useState } from "react";

// Live browser panel for the dashboard: real status from /api/browser/status,
// Start/Stop wired to the orchestrator via the app API. Every state shown is
// the truth from the server — "host not connected" is a state, not an error
// disguised as success.
//
// Host power: when wake/sleep is set up (/api/host/power), the panel also
// shows the demo host's real power state from GitHub and offers Wake host /
// Sleep host — so a free host that sleeps to save quota can be woken from
// right here, with no trip to GitHub.

type Status = {
  configured: boolean;
  hostOnline: boolean;
  dockerReady?: boolean;
  running: boolean;
};

type Power = {
  configured: boolean;
  state: string | null; // GitHub codespace state: "Available", "Shutdown", "Queued", "Provisioning", ...
};

export default function BrowserPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [power, setPower] = useState<Power | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // leave status as-is; the panel keeps its last honest state
    }
    try {
      const res = await fetch("/api/host/power");
      if (res.ok) setPower(await res.json());
    } catch {
      // power state unknown — the panel simply shows no power buttons
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function start() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/browser/launch", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.streamUrl) {
        window.open(data.streamUrl, "_blank", "noopener");
        setMsg("Browser started — it opened in a new tab. Your logins stay saved in your account storage.");
      } else {
        setMsg(data.error || "Browser could not start.");
      }
    } catch {
      setMsg("Browser could not start — the host did not answer.");
    }
    setBusy(false);
    load();
  }

  async function stop() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/browser/stop", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Browser stopped. Your profile and logins are saved in your account storage." : data.error || "Stop failed.");
    } catch {
      setMsg("Stop failed — the host did not answer.");
    }
    setBusy(false);
    load();
  }

  async function wake() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/host/power", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "wake" }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? "Waking your host — it takes about a minute or two to come online. This panel updates itself."
          : data.error || "Wake failed."
      );
    } catch {
      setMsg("Wake failed — GitHub did not answer.");
    }
    setBusy(false);
    load();
  }

  async function sleep() {
    setBusy(true);
    setMsg("");
    try {
      // Stop the browser first so its profile is saved before the host sleeps.
      if (status?.running) {
        await fetch("/api/browser/stop", { method: "POST" }).catch(() => {});
      }
      const res = await fetch("/api/host/power", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "sleep" }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? "Your host is going to sleep to save your free hours. Your profile and logins stay saved — wake the host from here any time."
          : data.error || "Sleep failed."
      );
    } catch {
      setMsg("Sleep failed — GitHub did not answer.");
    }
    setBusy(false);
    load();
  }

  const running = !!status?.running;
  const hostReady = !!status?.configured && !!status?.hostOnline && !!status?.dockerReady;

  const csState = power?.configured ? power.state : null;
  const csAsleep = csState === "Shutdown";
  const csAwake = csState === "Available";
  const csStarting = !!csState && !csAsleep && !csAwake;

  const pill = !status
    ? { text: "checking…", cls: "border-white/10 bg-white/5 text-zinc-400", dot: "bg-zinc-400" }
    : running
      ? { text: "running", cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" }
      : hostReady
        ? { text: "ready — stopped", cls: "border-amber-400/20 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" }
        : { text: "host offline", cls: "border-rose-400/20 bg-rose-400/10 text-rose-300", dot: "bg-rose-400" };

  const explanation = !status
    ? "Checking your browser host…"
    : !status.configured
      ? "Your browser host is not connected to the website yet. Once a host is connected, this panel comes alive. Nothing is running right now."
      : !status.hostOnline
        ? csAsleep
          ? "Your host is asleep to save your free hours — that is normal. Press Wake host below; it takes about a minute or two to come online."
          : csStarting
            ? "Your host is starting… give it a minute or two. This panel updates itself."
            : "Your browser host is configured but not answering right now — a free host may be asleep or still starting (waking can take about a minute). This panel updates itself; you can also press Start browser in a moment."
        : !status.dockerReady
          ? "Your host answered, but its browser engine is not ready yet. Give it a few seconds, then press Start browser."
          : running
            ? "Your cloud browser is running. Its profile — cookies and logins — is saved to your account storage and survives stops and restarts."
            : "Your host is online and ready. Press Start browser to launch your persistent cloud browser.";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18" />
              <path d="M6.5 6.5h.01M9.5 6.5h.01" />
            </svg>
          </span>
          <h2 className="font-semibold text-white">Your cloud browser</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${pill.cls}`}>
          <span className={`h-2 w-2 rounded-full ${pill.dot}`} />
          {pill.text}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{explanation}</p>
      {msg && <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">{msg}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        {running ? (
          <>
            <button onClick={start} disabled={busy} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-50">
              {busy ? "Working…" : "Open browser"}
            </button>
            <button onClick={stop} disabled={busy} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50">
              Stop browser
            </button>
          </>
        ) : (
          <button onClick={start} disabled={busy || !hostReady} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" title={hostReady ? "Start your cloud browser" : "Available when your browser host is online"}>
            {busy ? "Starting…" : "▶ Start browser"}
          </button>
        )}

        {csAsleep && !hostReady && (
          <button onClick={wake} disabled={busy} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90 disabled:opacity-50">
            {busy ? "Working…" : "⏰ Wake host"}
          </button>
        )}
        {csStarting && (
          <button disabled className="cursor-wait rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-zinc-300 opacity-70">
            Host is starting…
          </button>
        )}
        {!!power?.configured && (hostReady || csAwake) && !running && (
          <button onClick={sleep} disabled={busy} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50" title="Stop the host to save your free hours — your profile and logins stay saved">
            🌙 Sleep host
          </button>
        )}
        {!!power?.configured && (hostReady || csAwake) && running && (
          <button onClick={sleep} disabled={busy} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50" title="Stops your browser first (profile is saved), then puts the host to sleep">
            🌙 Sleep host
          </button>
        )}
      </div>
    </div>
  );
}
