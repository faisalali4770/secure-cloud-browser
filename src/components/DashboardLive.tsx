"use client";
import { useCallback, useEffect, useState } from "react";
import BrowserPanel, { type Power, type Status } from "@/components/BrowserPanel";

// Dashboard live section: owns the SINGLE status/power fetch for the whole
// dashboard. The browser panel and the stat cards below are both rendered
// from this one `status` object, so they can never contradict each other
// (previously the "Active sessions" card was a static placeholder that said
// "No browser is running" even while the panel showed a running browser).

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "white",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export default function DashboardLive() {
  const [status, setStatus] = useState<Status | null>(null);
  const [power, setPower] = useState<Power | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // leave status as-is; the dashboard keeps its last honest state
    }
    try {
      const res = await fetch("/api/host/power");
      if (res.ok) setPower(await res.json());
    } catch {
      // power state unknown — the panel simply shows no backup-host section
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const profiles = status?.profiles ?? [];
  const runningProfiles = profiles.filter((p) => p.running);

  const cards = [
    {
      title: "My browser profiles",
      value: status ? String(profiles.length) : "—",
      note: !status
        ? "Checking…"
        : profiles.length === 0
          ? "No profiles yet"
          : profiles.map((p) => p.name).join(", "),
      icon: (
        <svg {...iconProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M6.5 6.5h.01M9.5 6.5h.01" />
        </svg>
      ),
      chip: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
    },
    {
      title: "Active sessions",
      value: status ? String(runningProfiles.length) : "—",
      note: !status
        ? "Checking…"
        : runningProfiles.length === 0
          ? "No browser is running"
          : runningProfiles.map((p) => p.name).join(", "),
      icon: (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5v7l6-3.5z" />
        </svg>
      ),
      chip: "from-emerald-500 to-teal-400 shadow-emerald-500/30",
    },
    {
      title: "Shared with me",
      value: "—",
      note: "Sharing arrives in Phase 2",
      icon: (
        <svg {...iconProps}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
          <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20c-.5-2-1.7-3.5-3.5-4.3" />
        </svg>
      ),
      chip: "from-fuchsia-500 to-pink-500 shadow-fuchsia-500/30",
    },
    {
      title: "Pending invitations",
      value: "—",
      note: "Sharing arrives in Phase 2",
      icon: (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      ),
      chip: "from-amber-500 to-orange-400 shadow-amber-500/30",
    },
  ];

  return (
    <>
      {/* Live browser panel (real status + start/stop) */}
      <BrowserPanel status={status} power={power} refresh={load} />

      {/* Stat cards — profiles/sessions derive from the SAME status object
          as the panel above; sharing cards remain honest placeholders. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="glass group rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{c.title}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${c.chip}`}>{c.icon}</span>
            </div>
            <p className="mt-3 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">{c.value}</p>
            <p className="mt-1.5 text-xs text-zinc-500">{c.note}</p>
          </div>
        ))}
      </div>

    </>
  );
}
