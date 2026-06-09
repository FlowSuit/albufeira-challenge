"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { getChallenges, getClaimedChallenges, getAllSubmissions, getSettings, submitChallenge, validateFile } from "@/lib/data";
import { Challenge, ClaimedChallenge, DIFFICULTY_META, Difficulty, Submission } from "@/lib/types";
import { gamePhase, useNow } from "@/lib/hooks";

const ORDER: Difficulty[] = ["makkelijk", "gemiddeld", "heftig", "legendarisch"];

export default function ChallengesPage() {
  return <Shell>{(player) => <Suspense fallback={null}><Challenges playerId={player.id} /></Suspense>}</Shell>;
}

function Challenges({ playerId }: { playerId: string }) {
  const now = useNow(30000);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [claimed, setClaimed] = useState<ClaimedChallenge[]>([]);
  const [mySubs, setMySubs] = useState<Submission[]>([]);
  const [settings, setSettings] = useState(null as any);
  const [filter, setFilter] = useState<Difficulty | "alles">("alles");
  const [active, setActive] = useState<Challenge | null>(null);

  const load = useCallback(async () => {
    try {
      const [ch, cl, allSubs, st] = await Promise.all([
        getChallenges(), getClaimedChallenges(), getAllSubmissions(), getSettings()
      ]);
      setChallenges(ch); setClaimed(cl); setSettings(st);
      setMySubs(allSubs.filter(s => s.player_id === playerId));
    } catch {}
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  const claimedMap = useMemo(() => {
    const m = new Map<string, ClaimedChallenge>();
    claimed.forEach(c => m.set(c.challenge_id, c));
    return m;
  }, [claimed]);

  const mySubMap = useMemo(() => {
    const m = new Map<string, Submission>();
    mySubs.forEach(s => m.set(s.challenge_id, s));
    return m;
  }, [mySubs]);

  const phase = gamePhase(settings, now);
  const list = challenges.filter(c => filter === "alles" || c.difficulty === filter);
  const claimedCount = claimed.length;

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-2xl font-extrabold mb-1">🎯 Challenges</h1>
      <p className="text-white/50 text-sm mb-3">{claimedCount}/{challenges.length} geclaimed. Wie eerst komt...</p>

      {phase !== "live" && (
        <div className="glass rounded-xl p-3 mb-3 text-sm text-neon-gold">
          {phase === "voor" ? "Het spel is nog niet gestart." : "Het spel is afgelopen."}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {(["alles", ...ORDER] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold border ${
              filter === f ? "bg-white text-navy-950 border-white" : "bg-navy-800/50 border-white/10 text-white/70"
            }`}>{f === "alles" ? "Alles" : DIFFICULTY_META[f].label}</button>
        ))}
      </div>

      <div className="space-y-2 mt-2">
        {list.map(c => {
          const cl = claimedMap.get(c.id);
          const mySub = mySubMap.get(c.id);
          const meta = DIFFICULTY_META[c.difficulty];
          const isClaimed = !!cl;
          const isMine = cl?.claimed_by === (mySubs[0]?.player_id ? undefined : undefined); // name check
          const canSubmit = !isClaimed && !mySub && phase === "live";

          return (
            <button key={c.id} onClick={() => canSubmit && setActive(c)}
              className={`w-full text-left rounded-2xl p-4 border bg-navy-800/40 ${meta.ring} ${
                isClaimed ? "opacity-50" : ""
              } ${canSubmit ? "active:scale-[0.98]" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold leading-snug">{c.title}</span>
                <span className={`text-xs font-display font-bold ${isClaimed ? "text-white/30" : meta.color} whitespace-nowrap`}>+{c.points}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] uppercase tracking-wide font-bold ${isClaimed ? "text-white/30" : meta.color}`}>{meta.label}</span>
                <span className="flex-1" />
                {isClaimed ? (
                  <span className="text-xs font-bold text-white/40">🔒 {cl.claimed_by}</span>
                ) : mySub ? (
                  <span className={`text-xs font-bold ${mySub.status === "goedgekeurd" ? "text-neon-lime" : mySub.status === "afgekeurd" ? "text-neon-pink" : "text-neon-gold"}`}>
                    {mySub.status === "goedgekeurd" ? "✅ Jij!" : mySub.status === "afgekeurd" ? "❌ Afgekeurd" : "⏳ Wacht op admin"}
                  </span>
                ) : phase === "live" ? (
                  <span className="text-xs text-white/40">open →</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {active && <UploadModal playerId={playerId} challenge={active} onClose={() => setActive(null)} onDone={() => { setActive(null); load(); }} />}
    </div>
  );
}

function UploadModal({ playerId, challenge, onClose, onDone }: {
  playerId: string; challenge: Challenge; onClose: () => void; onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [err, setErr] = useState("");
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const meta = DIFFICULTY_META[challenge.difficulty];

  const pick = (f: File | null) => {
    setErr(""); if (!f) return;
    const v = validateFile(f);
    if (!v.ok) { setErr(v.error || "Ongeldig"); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setIsVideo(v.type === "video");
  };

  const send = async () => {
    if (!file) return; setBusy(true); setErr("");
    try { await submitChallenge(playerId, challenge, file, setPct); onDone(); }
    catch (e: any) { setErr(e?.message || "Upload mislukt."); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="glass rounded-3xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <span className={`text-xs uppercase tracking-wide font-bold ${meta.color}`}>{meta.label} - +{challenge.points}pt</span>
        <h2 className="font-display text-xl font-bold mt-1">{challenge.title}</h2>
        {preview && !isVideo && <img src={preview} alt="" className="w-full rounded-2xl mt-3 max-h-64 object-cover" />}
        {preview && isVideo && <video src={preview} controls className="w-full rounded-2xl mt-3 max-h-64 bg-black" />}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" capture="environment" className="hidden"
          onChange={e => pick(e.target.files?.[0] || null)} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn bg-navy-700 text-white w-full mt-3 border border-white/10">
          📸 {file ? "Ander bewijs" : "Foto of video"}
        </button>
        {err && <p className="text-neon-pink text-sm mt-2">{err}</p>}
        {busy && <div className="mt-3 h-2 bg-navy-700 rounded-full overflow-hidden"><div className="h-full bg-neon-cyan transition-all" style={{ width: `${pct}%` }} /></div>}
        <button onClick={send} disabled={!file || busy} className="btn bg-neon-lime text-navy-950 shadow-glow-lime w-full mt-3 disabled:opacity-30 disabled:shadow-none">
          {busy ? `Uploaden... ${pct}%` : "✅ Indienen"}
        </button>
        <button onClick={onClose} disabled={busy} className="w-full text-white/40 text-sm py-3">Annuleren</button>
      </div>
    </div>
  );
}
