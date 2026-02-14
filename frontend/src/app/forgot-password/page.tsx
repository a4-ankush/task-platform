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
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-zinc-600">
        We’ll generate a reset link (demo).
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {result && (
          <p className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-800">
            {result}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-black disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        <div className="text-sm">
          <Link href="/login" className="text-zinc-700 hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </main>
  );
}
