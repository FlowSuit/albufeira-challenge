"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { getScores, getTeamScores, getBadges } from "@/lib/data";
import { Badge, PlayerScore, TeamScore } from "@/lib/types";

export default function ResultsPage() { return <Shell>{() => <Results />}</Shell>; }

function Results() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [teams, setTeams] = useState<TeamScore[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    getScores().then(setScores).catch(() => {});
    getTeamScores().then(setTeams).catch(() => {});
    getBadges().then(setBadges).catch(() => {});
  }, []);

  const winner = teams[0];

  return (
    <div className="px-4 pt-6">
      <div className="text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-extrabold mt-2 neon-text-gold text-neon-gold">WINNEND TEAM</h1>
        {winner && <p className="font-display text-2xl font-bold mt-1">{winner.team}</p>}
        {winner && <p className="text-white/50 text-sm">{winner.members.join(" & ")}</p>}
        {winner && <p className="text-neon-pink font-bold text-lg">{winner.score} punten</p>}
      </div>

      <div className="flex items-end justify-center gap-2 mt-8">
        {[teams[1], teams[0], teams[2]].filter(Boolean).map((t, i) => {
          const h = [96, 128, 64][i];
          const c = ["text-neon-cyan", "text-neon-gold", "text-neon-pink"][i];
          const bg = ["bg-neon-cyan", "bg-neon-gold", "bg-neon-pink"][i];
          return (
            <div key={t.team} className="flex flex-col items-center w-24">
              <span className="text-3xl">{["🥈","🥇","🥉"][i]}</span>
              <span className="text-sm font-semibold truncate w-full text-center">{t.team}</span>
              <span className="text-xs text-white/50">{t.score}p</span>
              <div className={`${bg} w-full rounded-t-xl mt-1 opacity-80`} style={{ height: h }} />
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4 mt-8">
        <p className="font-display font-bold mb-2">Team eindstand</p>
        {teams.map((t, i) => {
          const last = i === teams.length - 1;
          return (
            <div key={t.team} className={`flex items-center gap-3 rounded-xl px-3 py-2 mb-1 ${last ? "bg-neon-pink/15 border border-neon-pink/40" : "bg-navy-800/40"}`}>
              <span className="w-7 text-center font-bold text-white/60">{i+1}</span>
              <div className="flex-1"><span className="font-semibold">{t.team}</span><br/><span className="text-[11px] text-white/30">{t.members.join(" & ")}</span></div>
              {last && <span className="text-neon-pink text-xs font-bold">straf 🍻</span>}
              <span className="font-display font-bold text-neon-pink">{t.score}</span>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4 mt-4">
        <p className="font-display font-bold mb-2">Solo top 3</p>
        {scores.slice(0, 3).map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-1.5">
            <span className="text-xl">{["🥇","🥈","🥉"][i]}</span>
            <span className="flex-1 font-semibold">{s.name}</span>
            <span className="font-bold text-neon-pink">{s.score}</span>
          </div>
        ))}
      </div>

      {badges.length > 0 && (
        <div className="glass rounded-2xl p-4 mt-4">
          <p className="font-display font-bold mb-2">🎖️ Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b.id} className="bg-navy-700/70 border border-white/10 rounded-full px-3 py-1 text-sm">
                {b.label} - {scores.find(s => s.id === b.player_id)?.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link href="/dashboard" className="btn bg-navy-700 text-white w-full mt-6 border border-white/10 block">← Terug</Link>
    </div>
  );
}
