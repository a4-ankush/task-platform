"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      router.replace("/board");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    }
  };

  return (
    <main className="tm-container py-10">
      <div className="mx-auto max-w-md">
        <div className="tm-card p-6 sm:p-7">
          <div className="tm-badge bg-slate-50 text-slate-700">
            Secure access
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to your workspace.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">
                Email
              </label>
              <input
                className="tm-input mt-1"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                Password
              </label>
              <input
                className="tm-input mt-1"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button disabled={isSubmitting} className="tm-button w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="tm-link">
                Forgot password?
              </Link>
              <Link href="/signup" className="tm-link">
                Create account
              </Link>
            </div>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: the first signed-up user becomes an admin.
        </p>
      </div>
    </main>
  );
}
