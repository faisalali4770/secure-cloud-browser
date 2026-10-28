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

type ProfileInfo = {
  id: string;
  name: string;
  browser: string; // "chromium" | "firefox"
  running: boolean;
};

type Status = {
  configured: boolean;
  hostOnline: boolean;
  dockerReady?: boolean;
  running: boolean;
  profiles?: ProfileInfo[];
};

// Mirrors BROWSER_LIMITS.maxProfilesPerUser on the server. That constant
// lives in a server lib (imports crypto), so it cannot be imported into
// this client component — keep the two in sync.
const PROFILE_LIMIT = 3;

type Power = {
  configured: boolean;
  state: string | null; // GitHub codespace state: "Available", "Shutdown", "Queued", "Provisioning", ...
};

export default function BrowserPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [power, setPower] = useState<Power | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrowser, setNewBrowser] = useState("chromium");

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

  async function startProfile(profileId: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/browser/launch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
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

  async function stopProfile(profileId: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/browser/stop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Browser stopped. Your profile and logins are saved in your account storage." : data.error || "Stop failed.");
    } catch {
      setMsg("Stop failed — the host did not answer.");
    }
    setBusy(false);
    load();
  }

  async function addProfile() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/browser/profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName, browser: newBrowser }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewName("");
        setNewBrowser("chromium");
        setMsg("Profile created — start it from its card above whenever your host is online.");
      } else {
        setMsg(data.error || "Profile could not be created.");
      }
    } catch {
      setMsg("Profile could not be created — the site did not answer.");
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
  const profiles = status?.profiles ?? [];
  const atProfileLimit = profiles.length >= PROFILE_LIMIT;

  const csState = power?.configured ? power.state : null;
  const csAsleep = csState === "Shutdown";
  const csAwake = csState === "Available";
  const csStarting = !!csState && !csAsleep && !csAwake;

  const pill = !status
    ? { text: "checking…", cls: "border-white/10 bg-white/5 text-zinc-400", dot: "bg-zinc-400" }
    : running
      ? { text: "running", cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" }
      : hostReady
        ? { text: "PC online — ready", cls: "border-amber-400/20 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" }
        : { text: "PC offline", cls: "border-rose-400/20 bg-rose-400/10 text-rose-300", dot: "bg-rose-400" };

  const explanation = !status
    ? "Checking your browser host…"
    : !status.configured
      ? "Your browser host is not connected to the website yet. Once a host is connected, this panel comes alive. Nothing is running right now."
      : !status.hostOnline
        ? csAsleep
          ? "Your PC is OFFLINE right now. If your PC is on and you are logged in, the host starts by itself and this panel turns online within a minute or two — it updates itself, just wait. If your PC is off, turn it on and log in first: a website cannot switch on a powered-off PC."
          : csStarting
            ? "Your host is starting… give it a minute or two. This panel updates itself."
            : "Your PC is OFFLINE right now. If your PC is on and you are logged in, the host starts by itself and this panel turns online within a minute or two — it updates itself, just wait. If your PC is off, turn it on and log in first: a website cannot switch on a powered-off PC."
        : !status.dockerReady
          ? "Your host answered, but its browser engine is not ready yet. Give it a few seconds, then press Start browser."
          : running
            ? "Your cloud browser is running. Its profile — cookies and logins — is saved to your account storage and survives stops and restarts."
            : "Your PC is ONLINE and your host is live. Press Start browser to launch your persistent cloud browser.";

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

      <div className="mt-4 space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-medium text-white">{p.name}</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                {p.browser === "firefox" ? "Firefox" : "Google Chrome"}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${p.running ? "text-emerald-300" : "text-zinc-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.running ? "bg-emerald-400" : "bg-zinc-500"}`} />
                {p.running ? "Running" : "Stopped"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.running ? (
                <>
                  <button onClick={() => startProfile(p.id)} disabled={busy} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-50">
                    {busy ? "Working…" : "Open browser"}
                  </button>
                  <button onClick={() => stopProfile(p.id)} disabled={busy} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50">
                    Stop browser
                  </button>
                </>
              ) : (
                <button onClick={() => startProfile(p.id)} disabled={busy || !hostReady} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" title={hostReady ? "Start your cloud browser" : "Available when your browser host is online"}>
                  {busy ? "Starting…" : "▶ Start browser"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {status && profiles.length === 0 && (
        <p className="mt-4 text-sm text-zinc-400">No browser profiles yet — create your first one below, then start it from here.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
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

      <div className="mt-5 border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-white">New profile</h3>
        {atProfileLimit ? (
          <p className="mt-2 text-sm text-zinc-400">Profile limit reached ({PROFILE_LIMIT}).</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Profile name (e.g. Work)"
              maxLength={40}
              className="min-w-48 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-indigo-400/50"
            />
            <select
              value={newBrowser}
              onChange={(e) => setNewBrowser(e.target.value)}
              className="rounded-full border border-white/15 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
            >
              <option value="chromium">Google Chrome</option>
              <option value="firefox">Firefox</option>
            </select>
            <button onClick={addProfile} disabled={busy || !newName.trim()} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Working…" : "Add profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
