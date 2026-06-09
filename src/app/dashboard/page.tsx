"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { getScores, getTeamScores, getSettings, getStrafChallenges, submitStrafProof } from "@/lib/data";
import { clearPlayer, isAdmin as checkAdmin } from "@/lib/session";
import { GameSettings, PlayerScore, TeamScore, StrafChallenge } from "@/lib/types";
import { fmtCountdown, gamePhase, useNow } from "@/lib/hooks";

export default function DashboardPage() {
  return <Shell>{(player) => <Dashboard playerId={player.id} name={player.name} team={player.team} />}</Shell>;
}

function Dashboard({ playerId, name, team }: { playerId: string; name: string; team: string | null }) {
  const router = useRouter();
  const now = useNow(1000);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [straffen, setStraffen] = useState<StrafChallenge[]>([]);
  const [viewMode, setViewMode] = useState<"team" | "solo">("team");
  const admin = checkAdmin();

  const load = useCallback(async () => {
    try {
      const [sc, ts, st, straf] = await Promise.all([getScores(), getTeamScores(), getSettings(), getStrafChallenges()]);
      setScores(sc); setTeamScores(ts); setSettings(st); setStraffen(straf);
    } catch {}
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, [load]);

  const me = scores.find(s => s.id === playerId);
  const myRank = scores.findIndex(s => s.id === playerId) + 1;
  const myTeamRank = teamScores.findIndex(t => t.team === team) + 1;
  const phase = gamePhase(settings, now);
  const target = settings ? (phase === "voor" ? new Date(settings.start_at).getTime() : new Date(settings.end_at).getTime()) : 0;
  const myStraffen = straffen.filter(s => s.player_id === playerId && (s.status === "open" || s.status === "ingediend"));

  return (
    <div className="px-4 pt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neon-violet text-xs font-semibold">{team}</p>
          <h1 className="font-display text-2xl font-extrabold">{name}</h1>
        </div>
        <button onClick={() => { clearPlayer(); router.replace("/"); }} className="text-white/40 text-xs underline">wissel</button>
      </div>

      <div className="glass rounded-2xl p-3 flex items-center justify-between">
        <span className="text-sm text-white/70">{phase === "voor" ? "Start over" : phase === "live" ? "⏱️ Eindigt over" : "🏁 Afgelopen"}</span>
        {phase !== "afgelopen" ? (
          <span className="font-display text-xl font-bold text-neon-cyan neon-text-cyan tabular-nums">{fmtCountdown(target - now)}</span>
        ) : (
          <Link href="/results" className="text-neon-gold font-bold text-sm underline">Winnaar →</Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { l: "Punten", v: me?.score ?? 0, c: "text-neon-pink" },
          { l: "Voltooid", v: me?.completed ?? 0, c: "text-neon-lime" },
          { l: "Solo", v: myRank ? `#${myRank}` : "-", c: "text-neon-cyan" },
          { l: "Team", v: myTeamRank ? `#${myTeamRank}` : "-", c: "text-neon-violet" },
        ].map(s => (
          <div key={s.l} className="glass rounded-2xl p-2.5 text-center">
            <div className={`font-display text-2xl font-extrabold ${s.c}`}>{s.v}</div>
            <div className="text-white/50 text-[10px] mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/challenges" className="btn bg-neon-cyan text-navy-950 shadow-glow-cyan">🎯 Challenges</Link>
        <Link href="/roulette" className="btn bg-neon-violet text-white shadow-glow-cyan">🎰 Roulette</Link>
      </div>

      {myStraffen.length > 0 && (
        <div className="rounded-2xl p-4 border-2 border-neon-pink/50 bg-neon-pink/5">
          <p className="font-bold text-neon-pink text-sm mb-2">🔥 Openstaande strafchallenge</p>
          {myStraffen.map(s => (
            <div key={s.id} className="py-2">
              <p className="font-semibold text-sm">{s.dare}</p>
              <p className="text-xs text-white/50 mt-1">
                {s.status === "open" ? "Upload bewijs - admin checkt het" : "⏳ Wacht op admin"}
              </p>
              {s.media_url && <p className="text-xs text-neon-lime mt-1">📎 Bewijs geupload</p>}
              {s.status === "open" && <StrafUploadBtn strafId={s.id} onDone={load} />}
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-lg">🏆 Ranglijst</p>
          <div className="flex gap-1">
            {(["team", "solo"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${viewMode === m ? "bg-white text-navy-950" : "bg-navy-800 text-white/50"}`}>
                {m === "team" ? "Teams" : "Solo"}
              </button>
            ))}
          </div>
        </div>
        {viewMode === "team" ? teamScores.map((t, i) => {
          const isMine = t.team === team;
          const isLast = i === teamScores.length - 1;
          return (
            <div key={t.team} className={`flex items-center gap-3 rounded-xl px-3 py-2 mb-1 ${
              isMine ? "bg-neon-violet/15 border border-neon-violet/30" : isLast ? "bg-neon-pink/10 border border-neon-pink/25" : "bg-navy-800/40"
            }`}>
              <span className="w-7 text-center font-display font-bold text-white/60">{["🥇","🥈","🥉"][i] || i+1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{t.team}{isMine ? " (jullie)" : ""}</span>
                <p className="text-[11px] text-white/30 truncate">{t.members.join(" & ")}</p>
              </div>
              <span className="font-display font-bold text-neon-pink">{t.score}</span>
            </div>
          );
        }) : scores.map((s, i) => (
          <div key={s.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 mb-1 ${
            s.id === playerId ? "bg-neon-cyan/15 border border-neon-cyan/30" : "bg-navy-800/40"
          }`}>
            <span className="w-7 text-center font-display font-bold text-white/60">{["🥇","🥈","🥉"][i] || i+1}</span>
            <span className="flex-1 font-semibold text-sm truncate">{s.name}{s.id === playerId ? " (jij)" : ""}</span>
            <span className="text-white/40 text-xs">{s.completed}✓</span>
            <span className="font-display font-bold text-neon-pink w-10 text-right">{s.score}</span>
          </div>
        ))}
      </div>

      {phase === "afgelopen" && (
        <Link href="/results" className="btn bg-navy-700 text-neon-gold border border-neon-gold/30 block">🏁 Eindscherm bekijken</Link>
      )}
    </div>
  );
}

function StrafUploadBtn({ strafId, onDone }: { strafId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const ref = { current: null as HTMLInputElement | null };
  const upload = async (file: File) => {
    setBusy(true);
    try { await submitStrafProof(strafId, file); onDone(); }
    catch { setBusy(false); }
  };
  return (
    <div className="mt-2">
      <input ref={el => { ref.current = el; }} type="file" accept="image/*,video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <button onClick={() => ref.current?.click()} disabled={busy}
        className="btn !py-2.5 !text-sm bg-navy-700 text-white border border-white/10 disabled:opacity-40">
        {busy ? "Uploaden..." : "📸 Upload bewijs"}
      </button>
    </div>
  );
}
