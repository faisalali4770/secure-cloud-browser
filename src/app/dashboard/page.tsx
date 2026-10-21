// Dashboard shell (Phase 1) — layout and empty states only.
// It is intentionally NOT wired to live data yet: profile CRUD and real
// session status are Phase 1 remaining work (see README PHASE 1 STATUS).
// Nothing on this page is fake data presented as real.

const cards = [
  { title: "My browser profiles", value: "—", note: "Profile CRUD not wired yet" },
  { title: "Active sessions", value: "—", note: "No browser is running" },
  { title: "Shared with me", value: "—", note: "Sharing arrives in Phase 2" },
  { title: "Pending invitations", value: "—", note: "Sharing arrives in Phase 2" }
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">Your cloud browsers, sessions and sharing — in one place.</p>
        </div>
        <button disabled className="cursor-not-allowed rounded-full bg-white/10 px-5 py-2.5 font-medium text-zinc-400" title="Browser launch is not available until the orchestrator service exists">
          Start browser (not available yet)
        </button>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute h-full w-full rounded-full bg-rose-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          </span>
          <h2 className="font-semibold text-white">Browser status</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Status: <span className="font-mono text-zinc-200">stopped</span> · Streaming (Chromium + KasmVNC) is
          <strong className="text-zinc-200"> not tested yet</strong> — Docker is unavailable in the current environment and the
          orchestrator runs as a clearly-labelled stub that refuses to launch rather than faking a browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="glass rounded-3xl p-5 transition hover:bg-white/[0.07]">
            <p className="text-sm text-zinc-400">{c.title}</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">{c.value}</p>
            <p className="mt-1.5 text-xs text-zinc-500">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white">Recent activity</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">No activity yet. Logins, launches, shares and revokes will appear here from the append-only audit log.</p>
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white">Security settings</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
            <li>Change password — Phase 1 remaining</li>
            <li>Two-factor authentication (TOTP + recovery codes) — Phase 1 remaining</li>
            <li>Sign out all devices — backend helper ready, UI pending</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
