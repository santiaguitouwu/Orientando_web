"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

export default function TopNav() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-end items-center px-lg py-xs sticky top-0 z-40 w-full">
      <div className="flex items-center gap-sm">
        <div className="flex items-center gap-sm cursor-default p-xs px-sm rounded-lg">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">
            A
          </div>
          <span className="font-body-md text-body-md text-on-surface">Administrador</span>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant mx-xs" />
        <button
          onClick={handleLogout}
          className="p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 duration-150 rounded-full"
          title="Cerrar sesión"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}
