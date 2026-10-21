// Dashboard (Phase 1) — redesigned shell: layout and honest empty states.
// It is intentionally NOT wired to live data yet: profile CRUD and real
// session status are Phase 1 remaining work (see README PHASE 1 STATUS).
// Nothing on this page is fake data presented as real — the "—" values and
// notes say exactly what is and is not wired.

const cards = [
  {
    title: "My browser profiles",
    value: "—",
    note: "Profile CRUD not wired yet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M6.5 6.5h.01M9.5 6.5h.01" />
      </svg>
    ),
    chip: "from-indigo-500 to-violet-500 shadow-indigo-500/30"
  },
  {
    title: "Active sessions",
    value: "—",
    note: "No browser is running",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8.5v7l6-3.5z" />
      </svg>
    ),
    chip: "from-emerald-500 to-teal-400 shadow-emerald-500/30"
  },
  {
    title: "Shared with me",
    value: "—",
    note: "Sharing arrives in Phase 2",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20c-.5-2-1.7-3.5-3.5-4.3" />
      </svg>
    ),
    chip: "from-fuchsia-500 to-pink-500 shadow-fuchsia-500/30"
  },
  {
    title: "Pending invitations",
    value: "—",
    note: "Sharing arrives in Phase 2",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
    chip: "from-amber-500 to-orange-400 shadow-amber-500/30"
  }
];

const securityItems = [
  { label: "Change password", status: "Phase 1 remaining" },
  { label: "Two-factor authentication (TOTP + recovery codes)", status: "Phase 1 remaining" },
  { label: "Sign out all devices", status: "Backend helper ready · UI pending" }
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      {/* Header band */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-28 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">Your cloud browsers, sessions and sharing — in one place.</p>
          </div>
          <button
            disabled
            className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-medium text-zinc-500"
            title="Browser launch is not available until the orchestrator service exists"
          >
            ▶ Start browser (not available yet)
          </button>
        </div>
      </div>

      {/* Browser status */}
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-400 shadow-lg shadow-rose-500/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
              </svg>
            </span>
            <h2 className="font-semibold text-white">Browser status</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            stopped
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Streaming (Chromium + KasmVNC) is <strong className="text-zinc-200">not tested yet</strong> — Docker is unavailable in the
          current environment and the orchestrator runs as a clearly-labelled stub that refuses to launch rather than faking a browser.
        </p>
      </div>

      {/* Stat cards */}
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

      {/* Activity + security */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h4l2.5-6 4 12L16 12h5" />
              </svg>
            </span>
            <h2 className="font-semibold text-white">Recent activity</h2>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">No activity yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
              Logins, launches, shares and revokes will appear here from the append-only audit log.
            </p>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <h2 className="font-semibold text-white">Security settings</h2>
          </div>
          <ul className="mt-4 divide-y divide-white/5">
            {securityItems.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-zinc-300">{item.label}</span>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
