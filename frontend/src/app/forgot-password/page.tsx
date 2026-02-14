"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { apiFetch } = useAuth();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<{
        ok: true;
        resetUrl?: string;
        token?: string;
      }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setResult(
        data.resetUrl
          ? `Reset URL (demo): ${data.resetUrl}`
          : "If the email exists, a reset link has been sent.",
      );
    } catch (e: any) {
      setError(e?.message || "Request failed");
    }
  };

  return (
    <main className="tm-container py-10">
      <div className="mx-auto max-w-md">
        <div className="tm-card p-6 sm:p-7">
          <div className="tm-badge bg-slate-50 text-slate-700">
            Account recovery
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Forgot password
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            We’ll generate a reset link (demo).
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

            {result && (
              <p className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-800">
                {result}
              </p>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button disabled={isSubmitting} className="tm-button w-full">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>

            <div className="text-sm">
              <Link href="/login" className="tm-link">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
