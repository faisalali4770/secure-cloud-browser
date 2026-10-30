"use client";
import { useCallback, useEffect, useState } from "react";

// Connections panel (Phase 5): the owner's master accounts, Muse-style.
// Har connection = ek account jo MALIK ne ek dafa master browser mein
// login kiya. Phir wo account kisi bhi profile ko ASSIGN (Deploy) ho
// sakta hai — ek account kai profiles ko bhi. Deploy ke baad profile
// bina login ke khulta hai, account ki site us ki bookmarks bar par aur
// pehle tab mein samne hoti hai. Password kabhi kisi ko nahi milta.

type Assignment = { profileId: string; deployedAt: string | null };
type Connection = {
  id: string;
  label: string;
  siteUrl: string;
  loginType: string; // "site" | "google"
  assignments: Assignment[];
};
type ProfileLite = { id: string; name: string; browser: string; description?: string | null };
type CheckUi =
  | { state: "done"; hasCookies: boolean; storeFound: boolean; host: string }
  | { state: "outdated" }
  | { state: "error"; message: string };

async function api(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

function errText(r: { status: number; data: Record<string, unknown> }): string {
  if (typeof r.data.message === "string") return r.data.message;
  if (typeof r.data.error === "string") return r.data.error;
  return `Kaam nahi ho saka (host jawab: ${r.status}).`;
}

export default function ConnectionsPanel() {
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msgByConn, setMsgByConn] = useState<Record<string, string>>({});
  const [checkByConn, setCheckByConn] = useState<Record<string, CheckUi>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // New-connection form
  const [newLabel, setNewLabel] = useState("");
  const [newSite, setNewSite] = useState("");
  const [newType, setNewType] = useState("site");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setConnections(data.connections ?? []);
      setProfiles(data.profiles ?? []);
      setLoadError("");
    } catch {
      setLoadError("Connections load nahi ho sakin — page refresh karke dobara dekho.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setMsg = (id: string, m: string) => setMsgByConn((s) => ({ ...s, [id]: m }));

  async function create() {
    setCreateError("");
    if (!newLabel.trim() || !newSite.trim()) {
      setCreateError("Naam aur site ka pata — dono lazmi hain.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), siteUrl: newSite.trim(), loginType: newType })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Connection nahi ban saka.");
        return;
      }
      setNewLabel("");
      setNewSite("");
      setNewType("site");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function openMaster(c: Connection) {
    setBusyKey(`open-${c.id}`);
    setMsg(c.id, "");
    try {
      const r = await api(`/api/connections/${c.id}/open`, {});
      if (r.ok && typeof r.data.streamUrl === "string") {
        window.open(r.data.streamUrl, "_blank", "noopener");
        setMsg(c.id, "Master browser khul gaya hai — wahan account login karo, phir yahan wapas aa kar Deploy karo.");
      } else if (r.status === 409 && r.data.error === "session_in_use") {
        setMsg(c.id, "Master browser pehle se kisi screen par khula hai — pehle use band karo ya wahi screen dekho.");
      } else {
        setMsg(c.id, errText(r));
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function closeMaster(c: Connection) {
    setBusyKey(`close-${c.id}`);
    try {
      const r = await api(`/api/connections/${c.id}/close`, {});
      setMsg(c.id, r.ok ? "Master browser band kar diya — login host par mehfooz hai." : errText(r));
    } finally {
      setBusyKey(null);
    }
  }

  async function checkLogin(c: Connection) {
    setBusyKey(`check-${c.id}`);
    try {
      const r = await api(`/api/connections/${c.id}/check`, {});
      if (r.ok) {
        setCheckByConn((s) => ({
          ...s,
          [c.id]: {
            state: "done",
            hasCookies: !!r.data.hasCookies,
            storeFound: !!r.data.storeFound,
            host: typeof r.data.host === "string" ? r.data.host : ""
          }
        }));
      } else if (r.status === 409 && r.data.error === "host_outdated") {
        setCheckByConn((s) => ({ ...s, [c.id]: { state: "outdated" } }));
      } else {
        setCheckByConn((s) => ({ ...s, [c.id]: { state: "error", message: errText(r) } }));
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function deploy(c: Connection, p: ProfileLite) {
    setBusyKey(`deploy-${c.id}-${p.id}`);
    setMsg(c.id, "");
    try {
      const r = await api(`/api/connections/${c.id}/deploy`, { profileId: p.id });
      if (r.ok) {
        setMsg(c.id, `'${p.name}' mein deploy ho gaya — ab ye profile kholo ge to account login mile ga, site pehle tab mein khule gi.`);
        await load();
      } else {
        setMsg(c.id, errText(r));
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function undeploy(c: Connection, p: ProfileLite) {
    setBusyKey(`undeploy-${c.id}-${p.id}`);
    setMsg(c.id, "");
    try {
      const r = await api(`/api/connections/${c.id}/undeploy`, { profileId: p.id });
      if (r.ok) {
        setMsg(c.id, `'${p.name}' se account wapas le liya — profile ka apna purana data wapas aa gaya.`);
        await load();
      } else {
        setMsg(c.id, errText(r));
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(c: Connection) {
    setBusyKey(`delete-${c.id}`);
    try {
      const res = await fetch(`/api/connections/${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeletingId(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(c.id, typeof data.error === "string" ? data.error : "Connection delete nahi ho saka.");
      }
    } finally {
      setBusyKey(null);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-400/60";
  const btnCls =
    "rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const primaryBtn = `${btnCls} bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-90`;
  const ghostBtn = `${btnCls} border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10`;

  return (
    <div className="glass mt-4 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Connections — mere accounts</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Account ek dafa yahan login karo, phir jin profiles ko access deni hai un par Deploy kar do — profile bina login ke khule ga.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
          Password kabhi share nahi hota
        </span>
      </div>

      {loadError && <p className="mt-3 text-sm text-rose-300">{loadError}</p>}

      {/* New connection */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-zinc-200">Naya account joro</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input className={inputCls} placeholder="Account ka naam — masalan: YouTube (Kaam wala)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <input className={inputCls} placeholder="Site — masalan: youtube.com" value={newSite} onChange={(e) => setNewSite(e.target.value)} />
          <select className={inputCls} value={newType} onChange={(e) => setNewType(e.target.value)} aria-label="Login ki qism">
            <option value="site">Site par login</option>
            <option value="google">Google (Gmail) se login</option>
          </select>
          <button className={primaryBtn} onClick={create} disabled={creating}>
            {creating ? "Ban raha hai…" : "Account joro"}
          </button>
        </div>
        {newType === "google" && (
          <p className="mt-2 text-xs leading-relaxed text-amber-300">
            Google wala account jis profile ko mile ga, wo profile us account ki Gmail aur Drive bhi khol sakega — sirf wahi Google account joro jo is kaam ke liye ho.
          </p>
        )}
        {createError && <p className="mt-2 text-sm text-rose-300">{createError}</p>}
      </div>

      {/* Connection cards */}
      {connections === null && !loadError && <p className="mt-4 text-sm text-zinc-500">Connections load ho rahi hain…</p>}
      {connections !== null && connections.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">Abhi koi connection nahi — upar se pehla account joro.</p>
      )}
      <div className="mt-4 grid gap-4">
        {(connections ?? []).map((c) => {
          const check = checkByConn[c.id];
          const busy = busyKey !== null && busyKey.endsWith(c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{c.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{c.siteUrl}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-300">
                      {c.loginType === "google" ? "Google (Gmail) se login" : "Site par login"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-300">
                      {c.assignments.length} profile{c.assignments.length === 1 ? "" : "s"} ko assign
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={primaryBtn} onClick={() => openMaster(c)} disabled={busyKey === `open-${c.id}`}>
                    {busyKey === `open-${c.id}` ? "Khul raha hai…" : "Login karo"}
                  </button>
                  <button className={ghostBtn} onClick={() => closeMaster(c)} disabled={busyKey === `close-${c.id}`}>
                    Band karo
                  </button>
                  <button className={ghostBtn} onClick={() => checkLogin(c)} disabled={busyKey === `check-${c.id}`}>
                    Login check
                  </button>
                  {deletingId === c.id ? (
                    <>
                      <button className={`${btnCls} bg-rose-500/90 text-white hover:bg-rose-500`} onClick={() => remove(c)} disabled={busyKey === `delete-${c.id}`}>
                        Pakka delete?
                      </button>
                      <button className={ghostBtn} onClick={() => setDeletingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className={ghostBtn} onClick={() => setDeletingId(c.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {c.loginType === "google" && (
                <p className="mt-2 text-xs leading-relaxed text-amber-300/90">
                  Ye Google account hai — jis profile ko mile ga wo Gmail/Drive bhi khol sakega.
                </p>
              )}

              {check && check.state === "done" && (
                <p className="mt-2 text-sm text-zinc-300">
                  {check.storeFound
                    ? check.hasCookies
                      ? `Andaza: login hai (${check.host} ki cookies master mein maujood hain).`
                      : `Andaza: login nahi lagta (${check.host} ki koi cookie nahi mili) — 'Login karo' se dobara login kar lo.`
                    : "Master mein abhi koi login data nahi — pehle 'Login karo' se login karo."}
                </p>
              )}
              {check && check.state === "outdated" && (
                <p className="mt-2 text-sm text-amber-300">Host purana hai — pehle host par Connections wala update chalao.</p>
              )}
              {check && check.state === "error" && <p className="mt-2 text-sm text-rose-300">{check.message}</p>}
              {msgByConn[c.id] && <p className="mt-2 text-sm text-zinc-300">{msgByConn[c.id]}</p>}
              {busy && <p className="mt-1 text-xs text-zinc-500">Kaam ho raha hai…</p>}

              {/* Assignments */}
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Kin profiles ko assign hai</p>
                {profiles.length === 0 && <p className="mt-1.5 text-sm text-zinc-500">Abhi koi profile nahi hai.</p>}
                <div className="mt-2 grid gap-2">
                  {profiles.map((p) => {
                    const a = c.assignments.find((x) => x.profileId === p.id);
                    const key = a ? `undeploy-${c.id}-${p.id}` : `deploy-${c.id}-${p.id}`;
                    return (
                      <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                        <div>
                          <span className="text-sm text-zinc-200">{p.name}</span>
                          {a && (
                            <span className="ml-2 text-xs text-emerald-300">
                              Deploy ho chuka{a.deployedAt ? ` — ${new Date(a.deployedAt).toLocaleString()}` : ""}
                            </span>
                          )}
                        </div>
                        {a ? (
                          <button className={ghostBtn} onClick={() => undeploy(c, p)} disabled={busyKey === key}>
                            {busyKey === key ? "Ho raha hai…" : "Access hatao"}
                          </button>
                        ) : (
                          <button className={primaryBtn} onClick={() => deploy(c, p)} disabled={busyKey === key}>
                            {busyKey === key ? "Ho raha hai…" : "Deploy karo"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
