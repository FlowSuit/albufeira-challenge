"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayer } from "@/lib/session";
import { Player } from "@/lib/types";
import { useOnline } from "@/lib/hooks";
import BottomNav from "./BottomNav";

export default function Shell({ children }: { children: (player: Player) => React.ReactNode }) {
  const router = useRouter();
  const online = useOnline();
  const [player, setPlayer] = useState<Player | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getPlayer();
    if (!p) router.replace("/");
    else setPlayer(p);
    setReady(true);
  }, [router]);

  if (!ready || !player)
    return (
      <div className="flex items-center justify-center min-h-dvh text-white/50">Laden…</div>
    );

  return (
    <div className="pb-24">
      {!online && (
        <div className="sticky top-0 z-40 bg-neon-gold text-navy-950 text-center text-sm font-bold py-1.5">
          📴 Offline — wijzigingen worden opnieuw geprobeerd
        </div>
      )}
      {children(player)}
      <BottomNav />
    </div>
  );
}
