import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Cloud Browser",
  description: "Persistent cloud Chrome with owner-controlled, password-free sharing."
};

function LockMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-zinc-100 antialiased">
        {/* Ambient background glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute right-[-10rem] top-64 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute left-[-8rem] top-[36rem] h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <LockMark />
              <span>
                Secure <span className="text-gradient">Cloud Browser</span>
              </span>
            </a>
            <div className="flex items-center gap-2 text-sm sm:gap-5">
              <a href="/dashboard" className="hidden px-2 py-1.5 text-zinc-300 transition hover:text-white sm:block">Dashboard</a>
              <a href="/login" className="px-2 py-1.5 text-zinc-300 transition hover:text-white">Log in</a>
              <a href="/register" className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90">
                Register
              </a>
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>

        <footer className="border-t border-white/5 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-zinc-500 sm:flex-row">
            <p>Secure Cloud Browser — persistent, shareable, password-free.</p>
            <div className="flex gap-5">
              <a href="/dashboard" className="transition hover:text-zinc-300">Dashboard</a>
              <a href="/login" className="transition hover:text-zinc-300">Log in</a>
              <a href="/register" className="transition hover:text-zinc-300">Register</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
