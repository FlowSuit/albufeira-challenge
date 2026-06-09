"use client";
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { getRouletteSpins, rouletteOutcomes, spinRoulette, getScores } from "@/lib/data";
import { RouletteSpin, PlayerScore } from "@/lib/types";

const COLORS = ["#22e0ff", "#c6ff3a", "#9b6bff", "#ffd23a", "#475569", "#ff2bd1", "#ef4444", "#f97316"];

export default function RoulettePage() {
  return <Shell>{(p) => <Roulette playerId={p.id} />}</Shell>;
}

function Roulette({ playerId }: { playerId: string }) {
  const outcomes = rouletteOutcomes();
  const seg = 360 / outcomes.length;
  const [mySpins, setMySpins] = useState<RouletteSpin[]>([]);
  const [myCompleted, setMyCompleted] = useState(0);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; points: number; dare: string | null } | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [allSpins, scores] = await Promise.all([getRouletteSpins(), getScores()]);
      setMySpins(allSpins.filter(s => s.player_id === playerId));
      const me = scores.find((s: PlayerScore) => s.id === playerId);
      setMyCompleted(me?.completed || 0);
    } catch {}
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  const maxSpins = 1 + Math.floor(myCompleted / 5);
  const canSpin = mySpins.length < maxSpins;
  const totalBonus = mySpins.reduce((a, s) => a + s.points_won, 0);

  const spin = async () => {
    if (spinning || !canSpin) return;
    setSpinning(true); setErr(""); setResult(null);
    try {
      const { index, label, points, dare } = await spinRoulette(playerId);
      const target = angle + 360 * 6 + (360 - (index * seg + seg / 2));
      setAngle(target);
      setTimeout(async () => {
        setResult({ label, points, dare });
        setSpinning(false);
        await load();
      }, 4200);
    } catch (e: any) {
      setErr(e?.message || "Draaien mislukt.");
      setSpinning(false);
    }
  };

  const wheelBg = `conic-gradient(${outcomes.map((_, i) => `${COLORS[i % COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;

  return (
    <div className="px-4 pt-5 flex flex-col items-center">
      <h1 className="font-display text-2xl font-extrabold mb-1">🎰 Roulette</h1>
      <p className="text-white/50 text-sm mb-2 text-center">
        Spins: {mySpins.length}/{maxSpins}. Elke 5 goedgekeurde challenges = extra spin.
      </p>

      <div className="relative w-72 h-72 mt-4">
        <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 text-3xl">▼</div>
        <div className="w-72 h-72 rounded-full border-4 border-white/20 shadow-glow-cyan"
          style={{ background: wheelBg, transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" : "none" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-navy-900 border-4 border-white/20 flex items-center justify-center text-2xl">🎲</div>
        </div>
      </div>

      {result && !spinning && (
        <div className="glass rounded-2xl p-5 mt-6 text-center w-full animate-pop">
          <p className="text-white/50 text-sm">Resultaat</p>
          <p className={`font-display text-2xl font-bold mt-1 ${result.points > 0 ? "text-neon-gold" : result.points < 0 ? "text-neon-pink" : "text-white"}`}>
            {result.label}
          </p>
          {result.dare && (
            <div className="mt-3 bg-neon-pink/10 border border-neon-pink/30 rounded-xl p-3">
              <p className="text-neon-pink font-semibold text-sm">{result.dare}</p>
              <p className="text-white/40 text-xs mt-1">Ga naar Home - upload bewijs - admin checkt het!</p>
            </div>
          )}
        </div>
      )}

      {canSpin && (
        <button onClick={spin} disabled={spinning}
          className="btn bg-neon-pink text-white shadow-glow-pink w-full max-w-xs mt-6 disabled:opacity-40">
          {spinning ? "Draaien..." : "🎯 DRAAI!"}
        </button>
      )}
      {!canSpin && (
        <p className="text-white/50 text-sm mt-6 text-center">
          Nog {5 - (myCompleted % 5)} goedgekeurde challenges voor je volgende spin.
        </p>
      )}

      {err && <p className="text-neon-pink text-sm mt-3">{err}</p>}

      {mySpins.length > 0 && (
        <div className="glass rounded-2xl p-4 mt-6 w-full">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold mb-2">Jouw spins</p>
          {mySpins.map(s => (
            <div key={s.id} className="flex justify-between py-1 text-sm">
              <span className="text-white/70">{s.label}</span>
              <span className={`font-bold ${s.points_won > 0 ? "text-neon-lime" : s.points_won < 0 ? "text-neon-pink" : "text-white/50"}`}>
                {s.points_won > 0 ? `+${s.points_won}` : s.points_won}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold">
            <span>Totaal</span>
            <span className={totalBonus >= 0 ? "text-neon-lime" : "text-neon-pink"}>
              {totalBonus > 0 ? `+${totalBonus}` : totalBonus}
            </span>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 mt-4 w-full">
        <p className="text-xs uppercase tracking-wider text-white/50 font-bold mb-2">Op het wiel</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-white/70">{o.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
