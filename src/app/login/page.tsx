"use client";
import { useState } from "react";

export default function LoginPage() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") })
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Logged in. Go to the dashboard." : data.error || "Login failed — is the database running?");
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Log in</h1>
      <label className="block text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>
      <label className="block text-sm">Password<input name="password" type="password" required className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>
      <button className="w-full rounded bg-zinc-900 py-2 text-white dark:bg-white dark:text-zinc-900">Log in</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
