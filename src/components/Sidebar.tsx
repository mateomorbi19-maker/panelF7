"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const links = [
    { href: "/conversaciones", label: "Conversaciones", icon: "💬" },
    { href: "/precios", label: "Precios", icon: "💰" },
  ];

  return (
    <aside className="w-64 bg-f7dark text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="F7" className="w-10 h-10 bg-white rounded-lg p-1" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Panel F7</h1>
            <p className="text-xs text-slate-400">Automotriz</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition",
                active
                  ? "bg-f7red text-white font-semibold"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-2">
        {userEmail && (
          <p className="text-xs text-slate-400 truncate" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-slate-300 hover:text-white py-2"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
