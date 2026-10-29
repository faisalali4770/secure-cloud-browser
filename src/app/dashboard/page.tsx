import DashboardLive from "@/components/DashboardLive";

// Dashboard — the live section (browser panel + stat cards) is rendered by
// DashboardLive, which fetches /api/browser/status ONCE and feeds both the
// panel and the cards from that single response, so the two can never
// contradict each other. The sharing cards stay honest "Phase 2"
// placeholders; nothing on this page is fake data presented as real.

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
        </div>
      </div>

      {/* Live browser panel + stat cards (one shared status fetch) */}
      <DashboardLive />

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
