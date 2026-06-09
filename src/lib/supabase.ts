import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 2 } },
});

export const PROOF_BUCKET = "proofs";
