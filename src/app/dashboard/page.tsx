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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button disabled className="cursor-not-allowed rounded bg-zinc-400 px-4 py-2 text-white" title="Browser launch is not available until the orchestrator service exists">
          Start browser (not available yet)
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <h2 className="font-semibold">Browser status</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Status: <span className="font-mono">stopped</span> · Streaming (Chromium + KasmVNC) is
          <strong> not tested yet</strong> — Docker is unavailable in the current environment and the
          orchestrator runs as a clearly-labelled stub that refuses to launch rather than faking a browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">{c.title}</p>
            <p className="mt-1 text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Recent activity</h2>
          <p className="mt-2 text-sm text-zinc-500">No activity yet. Logins, launches, shares and revokes will appear here from the append-only audit log.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Security settings</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
            <li>Change password — Phase 1 remaining</li>
            <li>Two-factor authentication (TOTP + recovery codes) — Phase 1 remaining</li>
            <li>Sign out all devices — backend helper ready, UI pending</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
