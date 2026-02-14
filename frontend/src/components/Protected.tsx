'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      router.replace('/board');
    }
  }, [loading, roles, router, user]);

  if (loading) return null;
  if (!user) return null;
  if (roles && roles.length > 0 && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
