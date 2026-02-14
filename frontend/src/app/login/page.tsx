'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';

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
      router.replace('/board');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-1 text-sm text-zinc-600">Welcome back.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="password"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          disabled={isSubmitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-black disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-zinc-700 hover:underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-zinc-700 hover:underline">
            Create account
          </Link>
        </div>
      </form>
    </main>
  );
}
