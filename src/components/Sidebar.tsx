"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

type IconProps = { className?: string };

const icons: Record<string, (p: IconProps) => JSX.Element> = {
  inbox: ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  contacts: ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  prices: ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  settings: ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: ({ className }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const LINKS = [
  { href: "/bandeja", label: "Bandeja", longLabel: "Bandeja de entrada", icon: "inbox" as const },
  { href: "/contactos", label: "Contactos", longLabel: "Contactos", icon: "contacts" as const },
  { href: "/precios", label: "Precios", longLabel: "Precios", icon: "prices" as const },
  { href: "/configuracion", label: "Ajustes", longLabel: "Configuración", icon: "settings" as const },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-f7panel border-r border-f7border flex-col shrink-0">
        <div className="p-5 border-b border-f7border">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="F7" className="w-12 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-base leading-tight text-white">Panel F7</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Automotriz</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = icons[link.icon];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium",
                  active
                    ? "bg-f7red text-white shadow-lg shadow-f7red/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="shrink-0" />
                <span>{link.longLabel}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-f7border">
          {userEmail && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Sesión</p>
              <p className="text-xs text-slate-300 truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            {icons.logout({})}
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar with logo + logout */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-f7panel border-b border-f7border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="F7" className="w-9 h-8 object-contain" />
          <h1 className="font-bold text-sm text-white">Panel F7</h1>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          {icons.logout({})}
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-f7panel border-t border-f7border flex items-stretch z-40 pb-[env(safe-area-inset-bottom)]">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = icons[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition",
                active
                  ? "text-f7red"
                  : "text-slate-500 active:text-white"
              )}
            >
              <div
                className={clsx(
                  "relative flex items-center justify-center transition-transform",
                  active && "scale-110"
                )}
              >
                <Icon />
                {active && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-f7red shadow-[0_0_8px_#E63946]" />
                )}
              </div>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
