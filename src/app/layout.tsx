import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Cloud Browser",
  description: "Persistent cloud Chrome with owner-controlled, password-free sharing."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="font-semibold">🔒 Secure Cloud Browser</a>
            <div className="flex gap-4 text-sm">
              <a href="/dashboard" className="hover:underline">Dashboard</a>
              <a href="/login" className="hover:underline">Log in</a>
              <a href="/register" className="rounded bg-zinc-900 px-3 py-1.5 text-white dark:bg-white dark:text-zinc-900">Register</a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
