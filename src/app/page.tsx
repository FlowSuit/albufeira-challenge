"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayers, registerPlayer } from "@/lib/data";
import { getPlayer, setPlayer, setAdmin } from "@/lib/session";
import { Player } from "@/lib/types";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "ALBU2026";

export default function Start() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [joinMode, setJoinMode] = useState<"pick" | "create">("create");
  const [agree, setAgree] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (getPlayer()) router.replace("/dashboard"); }, [router]);
  useEffect(() => {
    getPlayers().then(setPlayers).catch(() => setErr("Kan niet verbinden.")).finally(() => setLoading(false));
  }, []);

  const existingTeams = [...new Set(players.filter(p => p.team).map(p => p.team!))];
  const availableTeams = existingTeams.filter(t => players.filter(p => p.team === t).length < 2);
  const team = joinMode === "create" ? teamInput.trim() : teamInput;

  const start = async () => {
    const name = nameInput.trim();
    if (!name || !team || !agree) return;
    setBusy(true); setErr("");
    try {
      const p = await registerPlayer(name, team);
      if (adminInput.trim().toUpperCase() === ADMIN_CODE) setAdmin(true);
      setPlayer(p);
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Fout bij aanmelden.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh px-5 py-6 flex flex-col">
      <div className="text-center">
        <div className="text-5xl">🌴🍹🎉</div>
        <h1 className="font-display text-4xl font-extrabold mt-3 leading-none">
          <span className="neon-text-cyan text-neon-cyan">ALBUFEIRA</span><br />
          <span className="neon-text-pink text-neon-pink">CHALLENGE</span>
        </h1>
        <p className="text-white/50 text-sm mt-2">1 dag. 150 opdrachten. Wie durft, wint.</p>
      </div>

      {/* Naam */}
      <div className="glass rounded-3xl p-5 mt-6">
        <label className="text-xs uppercase tracking-wider text-white/50 font-bold">Jouw naam</label>
        <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Typ je naam"
          className="w-full mt-2 bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg" />
      </div>

      {/* Team */}
      <div className="glass rounded-3xl p-5 mt-3">
        <label className="text-xs uppercase tracking-wider text-white/50 font-bold">Team (max 2 per team)</label>
        <div className="flex gap-2 mt-2">
          {(["pick", "create"] as const).map(m => (
            <button key={m} onClick={() => setJoinMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold ${joinMode === m ? "bg-white text-navy-950" : "bg-navy-800/60 text-white/70"}`}>
              {m === "pick" ? "Bestaand team" : "Nieuw team"}
            </button>
          ))}
        </div>
        {joinMode === "pick" ? (
          <div className="flex flex-col gap-2 mt-3">
            {existingTeams.map(t => {
              const mem = players.filter(p => p.team === t);
              const full = mem.length >= 2;
              return (
                <button key={t} onClick={() => !full && setTeamInput(t)} disabled={full}
                  className={`glass p-3 text-left rounded-xl ${full ? "opacity-40" : ""} ${teamInput === t ? "border-2 border-neon-cyan" : "border border-white/10"}`}>
                  <span className="font-bold text-sm">{t}</span>
                  <span className="text-xs text-white/50 ml-2">{mem.map(m => m.name).join(" & ")}{full ? " (vol)" : ""}</span>
                </button>
              );
            })}
            {availableTeams.length === 0 && <p className="text-white/30 text-sm">Nog geen teams. Maak een nieuw team aan!</p>}
          </div>
        ) : (
          <input value={teamInput} onChange={e => setTeamInput(e.target.value)} placeholder="Bedenk een teamnaam"
            className="w-full mt-3 bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg" />
        )}
      </div>

      {/* Privacy + regels */}
      <div className="glass rounded-3xl p-5 mt-3 text-sm text-white/70">
        <p className="font-bold text-white mb-1">🔒 Privacy & ⚠️ Regels</p>
        <p>Alles is zichtbaar voor de groep. Geen illegale, gevaarlijke of respectloze opdrachten. Bij twijfel: niet doen.</p>
        <label className="flex items-center gap-3 mt-3 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-5 h-5 accent-neon-lime" />
          <span className="text-white">Akkoord</span>
        </label>
      </div>

      <details className="mt-3 text-sm text-white/50">
        <summary className="cursor-pointer">Admin/jury code?</summary>
        <input value={adminInput} onChange={e => setAdminInput(e.target.value)} placeholder="Code"
          className="w-full mt-2 bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3 text-white" />
        {adminInput.trim().toUpperCase() === ADMIN_CODE && <p className="text-neon-lime mt-1">✅ Admin actief</p>}
      </details>

      {loading && <p className="text-white/40 text-center mt-4">Laden...</p>}

      {/* Wie zit er al in */}
      {players.length > 0 && (
        <div className="glass rounded-3xl p-3 mt-3">
          <p className="text-xs text-white/50 font-bold mb-1">{players.length} spelers ingecheckt</p>
          <div className="flex flex-wrap gap-1">
            {players.map(p => <span key={p.id} className="text-xs bg-neon-cyan/10 text-neon-cyan rounded px-2 py-0.5">{p.name}</span>)}
          </div>
        </div>
      )}

      {err && <p className="text-neon-pink text-sm mt-2">{err}</p>}

      <button onClick={start} disabled={!nameInput.trim() || !team || !agree || busy}
        className="btn bg-neon-pink text-white shadow-glow-pink mt-4 disabled:opacity-30 disabled:shadow-none">
        {busy ? "Bezig..." : "Doe mee 🚀"}
      </button>
    </div>
  );
}
