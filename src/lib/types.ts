export type Difficulty = "makkelijk" | "gemiddeld" | "heftig" | "legendarisch";
export type SubStatus = "ingediend" | "goedgekeurd" | "afgekeurd";

export interface Player {
  id: string;
  name: string;
  team: string | null;
  score_adjustment: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  difficulty: Difficulty;
  points: number;
  sort: number;
}

export interface Submission {
  id: string;
  player_id: string;
  challenge_id: string;
  media_url: string;
  media_type: "image" | "video";
  status: SubStatus;
  bonus_points: number;
  created_at: string;
}

export interface StrafChallenge {
  id: string;
  player_id: string;
  dare: string;
  media_url: string | null;
  status: "open" | "ingediend" | "goedgekeurd" | "afgekeurd";
  created_at: string;
}

export interface RouletteSpin {
  id: string;
  player_id: string;
  label: string;
  points_won: number;
  created_at: string;
}

export interface Badge {
  id: string;
  player_id: string;
  type: string;
  label: string;
  created_at: string;
}

export interface GameSettings {
  id: number;
  start_at: string;
  end_at: string;
  featured_challenge_id: string | null;
  featured_until: string | null;
  is_closed: boolean;
}

export interface PlayerScore {
  id: string;
  name: string;
  team: string | null;
  score: number;
  completed: number;
}

export interface TeamScore {
  team: string;
  score: number;
  completed: number;
  members: string[];
}

export interface ClaimedChallenge {
  challenge_id: string;
  claimed_by: string;
  claimed_by_team: string;
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; points: number; color: string; glow: string; ring: string }
> = {
  makkelijk: { label: "Makkelijk", points: 1, color: "text-neon-cyan", glow: "shadow-glow-cyan", ring: "border-neon-cyan/40" },
  gemiddeld: { label: "Gemiddeld", points: 3, color: "text-neon-lime", glow: "shadow-glow-lime", ring: "border-neon-lime/40" },
  heftig: { label: "Heftig", points: 5, color: "text-neon-pink", glow: "shadow-glow-pink", ring: "border-neon-pink/40" },
  legendarisch: { label: "Legendarisch", points: 10, color: "text-neon-gold", glow: "shadow-glow-gold", ring: "border-neon-gold/50" },
};
