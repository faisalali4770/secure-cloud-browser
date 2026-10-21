const features = [
  {
    title: "Persistent profiles",
    desc: "Cookies and sign-ins survive stop/start, so you don't log in again every visit.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  },
  {
    title: "Password-free sharing",
    desc: "View-only or interactive access, with an expiry and instant revoke.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
      </svg>
    )
  },
  {
    title: "Isolated containers",
    desc: "One locked-down browser container per profile, with strict resource limits.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }
];

const steps = [
  ["Create your profile", "Launch a cloud browser and sign in to your own websites once."],
  ["Pick up where you left off", "Reconnect later from any device — cookies and sessions persist across stop/start."],
  ["Share the browser, not the password", "Grant view-only or interactive access with an expiry and instant revoke."]
];

export default function LandingPage() {
  return (
    <section className="space-y-20 pb-6">
      {/* Hero */}
      <div className="bg-dots relative space-y-7 pt-8 text-center">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Persistent cloud browser · Password-free sharing
        </span>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Your browser, in the cloud. <span className="text-gradient">Persistent and shareable</span> — without sharing passwords.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Launch a real cloud Chrome, sign in to your own websites once, and reconnect later
          from any device. Grant a trusted teammate time-limited access to the browser —
          never to your passwords, cookies, or account credentials.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <a href="/register" className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3 font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:opacity-90">
            Get started
          </a>
          <a href="/dashboard" className="glass rounded-full px-7 py-3 font-semibold text-zinc-100 transition hover:bg-white/10">
            Open dashboard
          </a>
        </div>
      </div>

      {/* Browser mockup (illustration) */}
      <div className="glass mx-auto max-w-4xl rounded-3xl p-2 shadow-2xl shadow-black/50">
        <div className="overflow-hidden rounded-2xl bg-zinc-900/90">
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
            <span className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </span>
            <span className="mx-auto flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs text-zinc-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              your-browser.cloud
            </span>
            <span className="w-10" />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {["Browser profile", "Browser profile", "Browser profile"].map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 text-indigo-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9z" /></svg>
                </div>
                <p className="text-sm font-medium text-zinc-200">{t}</p>
                <p className="mt-1 text-xs text-zinc-500">Persistent session · signed in once</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Honest notice — same words, modern dress */}
      <div className="mx-auto flex max-w-4xl gap-3 rounded-3xl border border-amber-300/20 bg-amber-400/[0.07] p-5 text-sm text-amber-200">
        <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l10 17H2L12 3z" />
          <path d="M12 10v4M12 17.5v.5" />
        </svg>
        <p>
          <strong>Please know before you start:</strong> some websites (including Facebook, Google and
          Instagram) may challenge or block sign-ins from cloud servers, ask for extra verification,
          or expire sessions. We never bypass CAPTCHAs, MFA or website security checks, and session
          persistence is best-effort — never guaranteed.
        </p>
      </div>

      {/* Features */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="glass group rounded-3xl p-6 transition hover:bg-white/[0.07]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              {f.icon}
            </div>
            <h2 className="font-semibold text-white">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
          </li>
        ))}
      </ul>

      {/* How it works */}
      <div className="space-y-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it <span className="text-gradient">works</span></h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="glass rounded-3xl p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-white">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
