"use client";
import { Player } from "./types";

const PLAYER_KEY = "albu_player";
const ADMIN_KEY = "albu_admin";

export function getPlayer(): Player | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

export function setPlayer(p: Player) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
}

export function clearPlayer() {
  localStorage.removeItem(PLAYER_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "1";
}

export function setAdmin(on: boolean) {
  if (on) localStorage.setItem(ADMIN_KEY, "1");
  else localStorage.removeItem(ADMIN_KEY);
}
