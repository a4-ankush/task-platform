"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cx } from "@/lib/utils";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cx(
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {label}
    </Link>
  );
}

export function TopNav() {
  const { user, logout, hasRole } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="tm-container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/board" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-sm">
              TM
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                Task Platform
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">
                Kanban • RBAC • Realtime
              </div>
            </div>
          </Link>
        </div>

        {user ? (
          <nav className="flex items-center gap-2">
            <NavLink href="/board" label="Board" />
            {hasRole("admin", "manager") && (
              <NavLink href="/users" label="Users" />
            )}

            <div className="hidden items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="max-w-48 truncate">{user.name}</span>
              <span className="tm-badge bg-slate-50 text-slate-700">
                {user.role}
              </span>
            </div>

            <button onClick={() => logout()} className="tm-button-secondary">
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink href="/login" label="Login" />
            <Link href="/signup" className="tm-button">
              Create account
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
