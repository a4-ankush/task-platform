"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await signup(values.email, values.name, values.password);
      router.replace("/board");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    }
  };

  return (
    <main className="tm-container py-10">
      <div className="mx-auto max-w-md">
        <div className="tm-card p-6 sm:p-7">
          <div className="tm-badge bg-indigo-50 text-indigo-700">
            New workspace
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            First user becomes admin automatically.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">Name</label>
              <input className="tm-input mt-1" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              {isSubmitting ? "Creating…" : "Create account"}
            </button>

            <div className="text-sm">
              <Link href="/login" className="tm-link">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
