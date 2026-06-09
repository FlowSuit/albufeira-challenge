import { createClient } from "@supabase/supabase-js";

const url = "https://blveuqrxvyfopywbtfuq.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdmV1cXJ4dnlmb3B5d2J0ZnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDI0NDcsImV4cCI6MjA5NjU3ODQ0N30.oipRvzt6lGxNK_-p-9u6iEjDwMklDJ88nqmtHcdw3M0";

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 2 } },
});

export const PROOF_BUCKET = "proofs";
