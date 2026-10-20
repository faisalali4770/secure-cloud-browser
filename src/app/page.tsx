export default function LandingPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Your browser, in the cloud. Persistent and shareable — without sharing passwords.</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Launch a real cloud Chrome, sign in to your own websites once, and reconnect later
          from any device. Grant a trusted teammate time-limited access to the browser —
          never to your passwords, cookies, or account credentials.
        </p>
        <div className="flex gap-3">
          <a href="/register" className="rounded bg-zinc-900 px-5 py-2.5 text-white dark:bg-white dark:text-zinc-900">Get started</a>
          <a href="/dashboard" className="rounded border border-zinc-300 px-5 py-2.5 dark:border-zinc-700">Open dashboard</a>
        </div>
      </div>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <strong>Please know before you start:</strong> some websites (including Facebook, Google and
        Instagram) may challenge or block sign-ins from cloud servers, ask for extra verification,
        or expire sessions. We never bypass CAPTCHAs, MFA or website security checks, and session
        persistence is best-effort — never guaranteed.
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {[
          ["Persistent profiles", "Cookies and sign-ins survive stop/start, so you don't log in again every visit."],
          ["Password-free sharing", "View-only or interactive access, with an expiry and instant revoke."],
          ["Isolated containers", "One locked-down browser container per profile, with strict resource limits."]
        ].map(([t, d]) => (
          <li key={t} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
