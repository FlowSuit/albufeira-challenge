"use client";
import { supabase, PROOF_BUCKET } from "./supabase";
import type {
  Challenge, GameSettings, PlayerScore, TeamScore, Player,
  Submission, StrafChallenge, Badge, RouletteSpin, ClaimedChallenge,
} from "./types";

export const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

async function retry<T>(fn: () => Promise<T>, n = 3, d = 800): Promise<T> {
  let err: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { err = e; await new Promise(r => setTimeout(r, d * (i + 1))); }
  }
  throw err;
}

// ── Players (vrije aanmelding) ──
export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from("players").select("*").order("name");
  if (error) throw error;
  return data as Player[];
}

export async function registerPlayer(name: string, team: string): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .upsert({ name, team }, { onConflict: "name" })
    .select()
    .single();
  if (error) throw error;
  return data as Player;
}

// ── Challenges ──
export async function getChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase.from("challenges").select("*").order("sort");
  if (error) throw error;
  return data as Challenge[];
}

// ── Scores ──
export async function getScores(): Promise<PlayerScore[]> {
  const { data, error } = await supabase.from("player_scores").select("*").order("score", { ascending: false });
  if (error) throw error;
  return data as PlayerScore[];
}

export async function getTeamScores(): Promise<TeamScore[]> {
  const { data, error } = await supabase.from("team_scores").select("*").order("score", { ascending: false });
  if (error) throw error;
  return data as TeamScore[];
}

// ── Settings ──
export async function getSettings(): Promise<GameSettings> {
  const { data, error } = await supabase.from("game_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data as GameSettings;
}

// ── Submissions ──
export async function getAllSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Submission[];
}

// ── Claimed challenges ──
export async function getClaimedChallenges(): Promise<ClaimedChallenge[]> {
  const { data, error } = await supabase.from("claimed_challenges").select("*");
  if (error) throw error;
  return data as ClaimedChallenge[];
}

// ── File validation ──
const IMG = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VID = ["video/mp4", "video/quicktime", "video/webm"];

export function validateFile(file: File): { ok: boolean; type?: "image" | "video"; error?: string } {
  if (file.size > MAX_BYTES) return { ok: false, error: "Max 50 MB." };
  if (IMG.includes(file.type)) return { ok: true, type: "image" };
  if (VID.includes(file.type)) return { ok: true, type: "video" };
  return { ok: false, error: "Alleen jpg, png, webp, mp4, mov of webm." };
}

// ── Submit challenge ──
export async function submitChallenge(
  playerId: string, challenge: Challenge, file: File, onProgress?: (n: number) => void
): Promise<void> {
  const v = validateFile(file);
  if (!v.ok) throw new Error(v.error);
  const ext = file.name.split(".").pop()?.toLowerCase() || "dat";
  const path = `${playerId}/${challenge.id}-${Date.now()}.${ext}`;
  onProgress?.(10);
  await retry(async () => {
    const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) throw error;
  });
  onProgress?.(80);
  const { data: pub } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
  let bonus = 0;
  try {
    const s = await getSettings();
    if (s.featured_challenge_id === challenge.id && s.featured_until && new Date(s.featured_until).getTime() > Date.now())
      bonus = challenge.points;
  } catch {}
  await retry(async () => {
    const { error } = await supabase.from("submissions").insert({
      player_id: playerId, challenge_id: challenge.id,
      media_url: pub.publicUrl, media_type: v.type, bonus_points: bonus,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Je hebt deze challenge al ingediend.");
      throw error;
    }
  });
  onProgress?.(100);
}

// ── Roulette ──
const OUTCOMES = [
  { label: "JACKPOT! +10 punten 💎", points: 10, dare: null },
  { label: "+5 bonuspunten 🎉", points: 5, dare: null },
  { label: "+3 punten 🍹", points: 3, dare: null },
  { label: "+1 troostpunt 🙂", points: 1, dare: null },
  { label: "Niks... 🥲", points: 0, dare: null },
  { label: "-2 punten 💀", points: -2, dare: null },
  { label: "-3 punten 😈", points: -3, dare: null },
  { label: "STRAFCHALLENGE 🔥", points: 0, dare: "Doe NU 15 push-ups voor de hele groep!" },
];
export function rouletteOutcomes() { return OUTCOMES; }

export async function getRouletteSpins(): Promise<RouletteSpin[]> {
  const { data, error } = await supabase.from("roulette_spins").select("*");
  if (error) throw error;
  return data as RouletteSpin[];
}

export async function spinRoulette(playerId: string): Promise<{ label: string; points: number; index: number; dare: string | null }> {
  const index = Math.floor(Math.random() * OUTCOMES.length);
  const out = OUTCOMES[index];
  const { error } = await supabase.from("roulette_spins").insert({
    player_id: playerId, label: out.label, points_won: out.points,
  });
  if (error) throw error;
  // Als het een strafchallenge is, maak een straf-record
  if (out.dare) {
    await supabase.from("straf_challenges").insert({ player_id: playerId, dare: out.dare });
  }
  return { label: out.label, points: out.points, index, dare: out.dare };
}

// ── Strafchallenges ──
export async function getStrafChallenges(): Promise<StrafChallenge[]> {
  const { data, error } = await supabase.from("straf_challenges").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as StrafChallenge[];
}

export async function submitStrafProof(strafId: string, file: File): Promise<void> {
  const v = validateFile(file);
  if (!v.ok) throw new Error(v.error);
  const ext = file.name.split(".").pop()?.toLowerCase() || "dat";
  const path = `straf/${strafId}-${Date.now()}.${ext}`;
  await retry(async () => {
    const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) throw error;
  });
  const { data: pub } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
  await supabase.from("straf_challenges").update({ media_url: pub.publicUrl, status: "ingediend" }).eq("id", strafId);
}

// ── Badges ──
export async function getBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.from("badges").select("*");
  if (error) throw error;
  return data as Badge[];
}

// ── Admin functies ──
export async function adminSetStatus(submissionId: string, status: "goedgekeurd" | "afgekeurd" | "ingediend") {
  const { error } = await supabase.from("submissions").update({ status }).eq("id", submissionId);
  if (error) throw error;
}

export async function adminDeleteSubmission(submissionId: string) {
  const { error } = await supabase.from("submissions").delete().eq("id", submissionId);
  if (error) throw error;
}

export async function adminDeletePlayer(playerId: string) {
  // players heeft on delete cascade: inzendingen, badges, spins en straffen gaan mee.
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw error;
}

export async function adminAdjustScore(playerId: string, delta: number) {
  const { data, error } = await supabase.from("players").select("score_adjustment").eq("id", playerId).single();
  if (error) throw error;
  await supabase.from("players").update({ score_adjustment: (data as { score_adjustment: number }).score_adjustment + delta }).eq("id", playerId);
}

export async function adminAddChallenge(c: { title: string; difficulty: string; points: number }) {
  const { error } = await supabase.from("challenges").insert({ ...c, sort: 999 });
  if (error) throw error;
}

export async function adminUpdateSettings(patch: Partial<GameSettings>) {
  const { error } = await supabase.from("game_settings").update(patch).eq("id", 1);
  if (error) throw error;
}

export async function adminApproveStraf(strafId: string) {
  const { error } = await supabase.from("straf_challenges").update({ status: "goedgekeurd" }).eq("id", strafId);
  if (error) throw error;
}

export async function adminRejectStraf(strafId: string) {
  const { error } = await supabase.from("straf_challenges").update({ status: "afgekeurd" }).eq("id", strafId);
  if (error) throw error;
}

export async function adminGrantBadge(playerId: string, type: string, label: string) {
  await supabase.from("badges").upsert({ player_id: playerId, type, label }, { onConflict: "player_id,type" });
}
