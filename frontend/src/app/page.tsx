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
    <main className="tm-container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="tm-card p-6 sm:p-8">
          <div className="tm-badge bg-indigo-50 text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Production-ready demo
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Task Management Platform
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Secure authentication, role-based access, a Kanban board with drag
            &amp; drop, and realtime updates via WebSockets.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link className="tm-button" href="/login">
              Continue to app
            </Link>
            <Link className="tm-button-secondary" href="/signup">
              Create account
            </Link>
            <Link className="tm-link text-sm" href="/board">
              View board
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Access</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                Admin / Manager / User
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Realtime</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                Socket.IO events
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs font-medium text-slate-500">Data</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                MongoDB + indexes
              </div>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="tm-card p-6">
            <div className="text-sm font-semibold text-slate-900">
              What you can demo in 60 seconds
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                Login and see role-based navigation
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                Create a task and drag between columns
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                Open a second tab to see realtime updates
              </li>
            </ul>
          </div>

          <div className="tm-card p-6">
            <div className="text-sm font-semibold text-slate-900">Notes</div>
            <p className="mt-2 text-sm text-slate-600">
              Password reset is demo-mode (API returns a reset URL). In a real
              production setup, this would be emailed.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
