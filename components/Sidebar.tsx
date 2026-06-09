"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/customers", icon: "group", label: "Clientes" },
  { href: "/chat-audit", icon: "forum", label: "Auditoría de chats" },
  { href: "/professionals", icon: "engineering", label: "Profesionales" },
  { href: "/areas", icon: "map", label: "Áreas y servicios" },
  { href: "/files", icon: "folder", label: "Archivos" },
  { href: "/user-management", icon: "manage_accounts", label: "Usuarios" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] z-50 bg-primary flex flex-col py-md shadow-sm">
      <div className="px-lg mb-xl">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white">health_metrics</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-primary leading-tight">
              Orientando
            </h1>
            <p className="font-label-md text-[10px] text-on-primary/60 uppercase tracking-widest">
              Panel de administración
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-sm space-y-base overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all font-label-md text-label-md ${
                isActive
                  ? "border-l-[4px] border-secondary-container bg-white/10 text-on-primary"
                  : "text-on-primary/70 hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-sm pt-md border-t border-white/10">
        <Link
          href="/login"
          className="flex items-center gap-md px-md py-sm rounded-lg text-on-primary/70 hover:bg-white/5 transition-all font-label-md text-label-md"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </Link>
      </div>
    </aside>
  );
}
