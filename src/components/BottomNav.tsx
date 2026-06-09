"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/session";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/vote", label: "Feed", icon: "📋" },
  { href: "/roulette", label: "Roulette", icon: "🎰" },
];

export default function BottomNav() {
  const path = usePathname();
  const [admin, setAdmin] = useState(false);
  useEffect(() => setAdmin(isAdmin()), []);

  const items = admin ? [...ITEMS, { href: "/admin", label: "Admin", icon: "🛠️" }] : ITEMS;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30">
      <div className="mx-auto max-w-md px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="glass rounded-t-3xl flex justify-around py-2">
          {items.map((it) => {
            const active = path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition ${
                  active ? "text-neon-cyan neon-text-cyan scale-105" : "text-white/55"
                }`}
              >
                <span className="text-xl">{it.icon}</span>
                <span className="text-[10px] font-semibold">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
