'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/app/lib/auth-store';
import { getStoredToken, getStoredRefreshToken, isTokenExpired, decodeJwtPayload } from '@/app/lib/api';

const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);

  const runCheck = useCallback(async () => {
    const token = getStoredToken();
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    // On public pages (login/register): if already logged in, redirect to dashboard
    if (isPublic) {
      if (token && !isTokenExpired(token)) {
        router.replace('/dashboard');
        return;
      }
      setChecking(false);
      return;
    }

    // On protected pages: require valid token
    if (!token || isTokenExpired(token)) {
      await logout();
      router.replace('/auth/login');
      return;
    }

    // Parse user from .NET JWT
    const payload = decodeJwtPayload(token);
    if (!payload) {
      await logout();
      router.replace('/auth/login');
      return;
    }

    // .NET claim names
    const nameId =
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) || '';
    const userName =
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) || '';
    const firstName =
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] as string) || '';
    const lastName =
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] as string) || '';
    const role =
      (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) || '';
    const permissions = (payload['Permission'] as string[]) || [];

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || userName;

    setUser({
      userId: nameId,
      userName: userName,
      phoneNumber: '',
      fullName: fullName,
      accessToken: token,
      refreshToken: getStoredRefreshToken() || '',
      expiresIn: payload.exp ? (payload.exp as number) - Math.floor(Date.now() / 1000) : 3600,
      issuedAt: new Date().toISOString(),
      roles: role ? [role] : [],
      requiresRegistration: false,
      permissions,
    });

    setChecking(false);
  }, [pathname, router, setUser, logout]);

  useEffect(() => {
    // بررسی احراز هویت در هر تغییر مسیر
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(true);
    runCheck();
  }, [runCheck]);

  if (checking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
