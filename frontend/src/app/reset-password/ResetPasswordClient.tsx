"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { apiFetch } = useAuth();

  const defaults = useMemo(
    () => ({
      email: search.get("email") || "",
      token: search.get("token") || "",
      newPassword: "",
    }),
    [search],
  );

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setOk(false);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setOk(true);
      setTimeout(() => router.replace("/login"), 800);
    } catch (e: any) {
      setError(e?.message || "Reset failed");
    }
  };

  return (
    <main className="tm-container py-10">
      <div className="mx-auto max-w-md">
        <div className="tm-card p-6 sm:p-7">
          <div className="tm-badge bg-slate-50 text-slate-700">
            Set a new password
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Reset password
          </h1>

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
                Token
              </label>
              <input className="tm-input mt-1" {...register("token")} />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.token.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                New password
              </label>
              <input
                className="tm-input mt-1"
                type="password"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {ok && (
              <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Password updated.
              </p>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button disabled={isSubmitting} className="tm-button w-full">
              {isSubmitting ? "Updating…" : "Update password"}
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
