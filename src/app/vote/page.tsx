"use client";
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { getAllSubmissions, getChallenges, getPlayers, getStrafChallenges, adminSetStatus, adminDeleteSubmission, adminApproveStraf, adminRejectStraf } from "@/lib/data";
import { isAdmin as checkAdmin } from "@/lib/session";
import { Challenge, Player, Submission, StrafChallenge, DIFFICULTY_META } from "@/lib/types";

export default function FeedPage() {
  return <Shell>{(p) => <Feed myId={p.id} />}</Shell>;
}

function Feed({ myId }: { myId: string }) {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [straffen, setStraffen] = useState<StrafChallenge[]>([]);
  const [admin, setAdmin] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p, c, st] = await Promise.all([getAllSubmissions(), getPlayers(), getChallenges(), getStrafChallenges()]);
      setSubs(s); setPlayers(p); setChallenges(c); setStraffen(st);
    } catch {}
  }, []);

  useEffect(() => { setAdmin(checkAdmin()); load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [load]);

  const pName = (id: string) => players.find(p => p.id === id)?.name || "?";
  const pTeam = (id: string) => players.find(p => p.id === id)?.team || "?";
  const ch = (id: string) => challenges.find(c => c.id === id);
  const pendingStraffen = straffen.filter(s => s.status === "ingediend");

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-2xl font-extrabold mb-1">📋 Feed</h1>
      <p className="text-white/50 text-sm mb-4">
        {admin ? "Jij bent admin - keur inzendingen goed of af." : "Alle inzendingen. Admin keurt goed."}
      </p>

      {admin && pendingStraffen.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 border-2 border-neon-gold/50 bg-neon-gold/5">
          <p className="font-bold text-neon-gold text-sm mb-2">🔥 Strafchallenges (admin)</p>
          {pendingStraffen.map(s => (
            <div key={s.id} className="py-2 border-b border-white/10 last:border-0">
              <p className="text-sm"><span className="font-semibold">{pName(s.player_id)}:</span> {s.dare}</p>
              {s.media_url && (
                <a href={s.media_url} target="_blank" rel="noreferrer" className="text-xs text-neon-cyan underline">Bewijs bekijken</a>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={async () => { await adminApproveStraf(s.id); load(); }}
                  className="btn !py-2 !text-sm bg-neon-lime text-navy-950">✅ Gedaan</button>
                <button onClick={async () => { await adminRejectStraf(s.id); load(); }}
                  className="btn !py-2 !text-sm bg-navy-700 text-neon-pink border border-neon-pink/40">❌ Niet gedaan</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subs.length === 0 && (
        <div className="glass rounded-2xl p-6 text-center text-white/50">Nog geen inzendingen</div>
      )}

      <div className="space-y-3">
        {subs.map(s => {
          const c = ch(s.challenge_id);
          const meta = c ? DIFFICULTY_META[c.difficulty] : null;
          return (
            <div key={s.id} className="glass rounded-2xl overflow-hidden">
              {s.media_type === "image" ? (
                <img src={s.media_url} alt="" className="w-full max-h-72 object-cover bg-black" loading="lazy" />
              ) : (
                <video src={s.media_url} controls preload="none" className="w-full max-h-72 bg-black" />
              )}
              <div className="p-4">
                <p className="text-xs text-white/50">
                  {pName(s.player_id)} <span className="text-neon-violet">({pTeam(s.player_id)})</span>
                </p>
                <p className="font-semibold">{c?.title}</p>
                <p className={`text-xs font-bold mt-2 ${
                  s.status === "goedgekeurd" ? "text-neon-lime" : s.status === "afgekeurd" ? "text-neon-pink" : "text-neon-gold"
                }`}>
                  {s.status === "goedgekeurd" ? "✅ Goedgekeurd" : s.status === "afgekeurd" ? "❌ Afgekeurd" : "⏳ Wacht op admin"}
                </p>
                {admin && s.status === "ingediend" && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button onClick={async () => { await adminSetStatus(s.id, "goedgekeurd"); load(); }}
                      className="btn !py-2 !text-sm bg-neon-lime text-navy-950">✅</button>
                    <button onClick={async () => { await adminSetStatus(s.id, "afgekeurd"); load(); }}
                      className="btn !py-2 !text-sm bg-navy-700 text-neon-pink border border-neon-pink/40">❌</button>
                    <button onClick={async () => { if(confirm("Verwijderen?")){ await adminDeleteSubmission(s.id); load(); }}}
                      className="btn !py-2 !text-sm bg-navy-700 text-white/50">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
