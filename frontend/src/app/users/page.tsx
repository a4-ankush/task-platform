"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roleClass = (role: string) => {
    if (role === "admin")
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    if (role === "manager") return "border-cyan-200 bg-cyan-50 text-cyan-700";
    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const data = await apiFetch<{ items: User[] }>("/api/users?limit=50");
        setItems(data.items);
      } catch (e: any) {
        setError(e?.message || "Failed to load users");
      }
    };

    load();
  }, [apiFetch]);

  return (
    <Protected roles={["admin", "manager"]}>
      <main className="tm-container py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Users
            </h1>
            <p className="mt-1 text-sm text-slate-600">Admin/Manager view.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="tm-badge bg-white text-slate-700">
              {items.length} users
            </span>
            <span className="tm-badge bg-indigo-50 text-indigo-700">
              Directory
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="tm-card mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b bg-slate-50/70 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Team</div>
            <div className="text-xs text-slate-600">
              Sorted by backend query
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`tm-badge ${roleClass(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-10" colSpan={3}>
                    <div className="mx-auto max-w-md text-center">
                      <div className="text-sm font-semibold text-slate-900">
                        No users yet
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Create accounts from the Signup page. The first account
                        becomes an admin automatically.
                      </p>
                    </div>
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
