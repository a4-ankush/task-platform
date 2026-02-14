'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cx } from '@/lib/utils';

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cx(
        'rounded-md px-3 py-2 text-sm font-medium transition',
        active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
      )}
    >
      {label}
    </Link>
  );
}

export function TopNav() {
  const { user, logout, hasRole } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/board" className="text-base font-semibold">
            Task Platform
          </Link>
          <span className="hidden text-xs text-zinc-500 sm:inline">RBAC + Realtime</span>
        </div>

        {user ? (
          <nav className="flex items-center gap-2">
            <NavLink href="/board" label="Board" />
            {hasRole('admin', 'manager') && <NavLink href="/users" label="Users" />}
            <button
              onClick={() => logout()}
              className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink href="/login" label="Login" />
            <NavLink href="/signup" label="Signup" />
          </nav>
        )}
      </div>
    </header>
  );
}
