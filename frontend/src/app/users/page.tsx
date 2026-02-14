'use client';

import { useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/lib/types';

export default function UsersPage() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const data = await apiFetch<{ items: User[] }>('/api/users?limit=50');
        setItems(data.items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
      }
    };

    load();
  }, [apiFetch]);

  return (
    <Protected roles={['admin', 'manager']}>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-zinc-600">Admin/Manager view.</p>

        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">{u.role}</span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-zinc-600" colSpan={3}>
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </Protected>
  );
}
