"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/board");
  }, [loading, router, user]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Task Management Platform</h1>
      <p className="mt-2 text-zinc-600">
        Secure auth, RBAC, Kanban board, and realtime updates.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 text-white"
          href="/login"
        >
          Login
        </Link>
        <Link className="rounded-md border px-4 py-2" href="/signup">
          Signup
        </Link>
      </div>
    </main>
  );
}
