"use client";
import { useEffect, useState } from "react";
import { GameSettings } from "./types";

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(i);
  }, [intervalMs]);
  return now;
}

export type GamePhase = "voor" | "live" | "afgelopen";

export function gamePhase(s: GameSettings | null, now: number): GamePhase {
  if (!s) return "live";
  if (s.is_closed) return "afgelopen";
  const start = new Date(s.start_at).getTime();
  const end = new Date(s.end_at).getTime();
  if (now < start) return "voor";
  if (now > end) return "afgelopen";
  return "live";
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
}
