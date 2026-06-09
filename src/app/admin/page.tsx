"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import {
  adminAddChallenge,
  adminAdjustScore,
  adminDeleteSubmission,
  adminGrantBadge,
  adminSetStatus,
  adminUpdateSettings,
  getAllSubmissions,
  getChallenges,
  getPlayers,
  getScores,
  getSettings,
} from "@/lib/data";
import { isAdmin } from "@/lib/session";
import { Challenge, Difficulty, GameSettings, Player, PlayerScore, Submission } from "@/lib/types";

export default function AdminPage() {
  return <Shell>{() => <Admin />}</Shell>;
}

function Admin() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [tab, setTab] = useState<"jury" | "scores" | "settings">("jury");

  useEffect(() => {
    if (!isAdmin()) router.replace("/dashboard");
    else setOk(true);
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [s, p, sc, c, st] = await Promise.all([
        getAllSubmissions(),
        getPlayers(),
        getScores(),
        getChallenges(),
        getSettings(),
      ]);
      setSubs(s);
      setPlayers(p);
      setScores(sc);
      setChallenges(c);
      setSettings(st);
    } catch {}
  }, []);

  useEffect(() => {
    if (ok) load();
  }, [ok, load]);

  if (!ok) return null;

  const name = (id: string) => players.find((p) => p.id === id)?.name || "?";
  const title = (id: string) => challenges.find((c) => c.id === id)?.title || "?";

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-2xl font-extrabold mb-3">🛠️ Admin</h1>

      <div className="flex gap-2 mb-4">
        {(["jury", "scores", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              tab === t ? "bg-white text-navy-950" : "bg-navy-800/60 text-white/70"
            }`}
          >
            {t === "jury" ? "Jury" : t === "scores" ? "Scores" : "Instellingen"}
          </button>
        ))}
      </div>

      {/* JURY */}
      {tab === "jury" && (
        <div className="space-y-3">
          {subs.map((s) => (
            <div key={s.id} className="glass rounded-2xl overflow-hidden">
              {s.media_type === "image" ? (
                <img src={s.media_url} alt="" className="w-full max-h-56 object-cover bg-black" loading="lazy" />
              ) : (
                <video src={s.media_url} controls preload="none" className="w-full max-h-56 bg-black" />
              )}
              <div className="p-3">
                <p className="text-xs text-white/50">
                  {name(s.player_id)} ·{" "}
                  <span
                    className={
                      s.status === "goedgekeurd"
                        ? "text-neon-lime"
                        : s.status === "afgekeurd"
                        ? "text-neon-pink"
                        : "text-neon-gold"
                    }
                  >
                    {s.status}
                  </span>
                </p>
                <p className="font-semibold text-sm">{title(s.challenge_id)}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={async () => {
                      await adminSetStatus(s.id, "goedgekeurd");
                      load();
                    }}
                    className="btn !py-2 !text-sm bg-neon-lime text-navy-950"
                  >
                    Goed
                  </button>
                  <button
                    onClick={async () => {
                      await adminSetStatus(s.id, "afgekeurd");
                      load();
                    }}
                    className="btn !py-2 !text-sm bg-navy-700 text-neon-pink border border-neon-pink/40"
                  >
                    Af
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Inzending verwijderen?")) {
                        await adminDeleteSubmission(s.id);
                        load();
                      }
                    }}
                    className="btn !py-2 !text-sm bg-navy-700 text-white/70"
                  >
                    🗑️
                  </button>
                </div>
                {s.media_type === "video" && (
                  <button
                    onClick={async () => {
                      await adminGrantBadge(s.player_id, "beste_video", "🎥 Beste video");
                      await adminAdjustScore(s.player_id, 10);
                      load();
                      alert("Beste video toegekend (+10)");
                    }}
                    className="w-full mt-2 text-xs text-neon-gold underline"
                  >
                    👑 Bekroon als beste video van de dag (+10)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCORES */}
      {tab === "scores" && (
        <div className="space-y-2">
          {scores.map((s) => (
            <div key={s.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <span className="flex-1 font-semibold">{s.name}</span>
              <span className="font-display font-bold text-neon-pink w-10 text-right">{s.score}</span>
              <button
                onClick={async () => {
                  await adminAdjustScore(s.id, 1);
                  load();
                }}
                className="w-9 h-9 rounded-lg bg-neon-lime text-navy-950 font-bold"
              >
                +
              </button>
              <button
                onClick={async () => {
                  await adminAdjustScore(s.id, -1);
                  load();
                }}
                className="w-9 h-9 rounded-lg bg-navy-700 text-white font-bold"
              >
                −
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && settings && (
        <SettingsPanel settings={settings} challenges={challenges} onSaved={load} />
      )}
    </div>
  );
}

function SettingsPanel({
  settings,
  challenges,
  onSaved,
}: {
  settings: GameSettings;
  challenges: Challenge[];
  onSaved: () => void;
}) {
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };
  const [start, setStart] = useState(toLocal(settings.start_at));
  const [end, setEnd] = useState(toLocal(settings.end_at));
  const [featured, setFeatured] = useState(settings.featured_challenge_id || "");
  const [hours, setHours] = useState(1);
  const [newTitle, setNewTitle] = useState("");
  const [newDiff, setNewDiff] = useState<Difficulty>("makkelijk");
  const POINTS: Record<Difficulty, number> = { makkelijk: 1, gemiddeld: 3, heftig: 5, legendarisch: 10 };

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="font-bold">⏱️ Speeltijd (1 dag)</p>
        <label className="block text-sm text-white/60">
          Start
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full mt-1 bg-navy-800 rounded-xl px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-white/60">
          Einde
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full mt-1 bg-navy-800 rounded-xl px-3 py-2 text-white"
          />
        </label>
        <button
          onClick={async () => {
            await adminUpdateSettings({
              start_at: new Date(start).toISOString(),
              end_at: new Date(end).toISOString(),
              is_closed: false,
            });
            onSaved();
            alert("Tijden opgeslagen");
          }}
          className="btn !py-2.5 bg-neon-cyan text-navy-950 w-full"
        >
          Opslaan
        </button>
        <button
          onClick={async () => {
            if (confirm("Spel nu sluiten? Niemand kan meer uploaden.")) {
              await adminUpdateSettings({ is_closed: true });
              onSaved();
            }
          }}
          className="btn !py-2.5 bg-navy-700 text-neon-pink border border-neon-pink/40 w-full"
        >
          🔒 Spel direct sluiten
        </button>
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="font-bold">🔥 Challenge van het uur</p>
        <select
          value={featured}
          onChange={(e) => setFeatured(e.target.value)}
          className="w-full bg-navy-800 rounded-xl px-3 py-2 text-white"
        >
          <option value="">— geen —</option>
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="block text-sm text-white/60">
          Duur (uren)
          <input
            type="number"
            min={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full mt-1 bg-navy-800 rounded-xl px-3 py-2 text-white"
          />
        </label>
        <button
          onClick={async () => {
            await adminUpdateSettings({
              featured_challenge_id: featured || null,
              featured_until: featured
                ? new Date(Date.now() + hours * 3600_000).toISOString()
                : null,
            });
            onSaved();
            alert("Ingesteld");
          }}
          className="btn !py-2.5 bg-neon-gold text-navy-950 w-full"
        >
          Activeren
        </button>
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="font-bold">➕ Nieuwe challenge</p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titel"
          className="w-full bg-navy-800 rounded-xl px-3 py-2 text-white"
        />
        <select
          value={newDiff}
          onChange={(e) => setNewDiff(e.target.value as Difficulty)}
          className="w-full bg-navy-800 rounded-xl px-3 py-2 text-white"
        >
          <option value="makkelijk">Makkelijk (1)</option>
          <option value="gemiddeld">Gemiddeld (3)</option>
          <option value="heftig">Heftig (5)</option>
          <option value="legendarisch">Legendarisch (10)</option>
        </select>
        <button
          onClick={async () => {
            if (!newTitle.trim()) return;
            await adminAddChallenge({ title: newTitle.trim(), difficulty: newDiff, points: POINTS[newDiff] });
            setNewTitle("");
            onSaved();
            alert("Toegevoegd");
          }}
          className="btn !py-2.5 bg-neon-lime text-navy-950 w-full"
        >
          Toevoegen
        </button>
      </div>
    </div>
  );
}
