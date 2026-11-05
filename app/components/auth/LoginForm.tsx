'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Alert, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { LogIn, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/app/lib/auth-store';
import PasswordInput from './PasswordInput';
import { fieldSx } from './fieldStyles';

const REMEMBER_KEY = 'remembered-username';

const loginSchema = z.object({
  username: z.string().min(1, 'نام کاربری الزامی است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function getSavedUsername(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [remember, setRemember] = useState(() => getSavedUsername() !== '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: getSavedUsername(), password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, data.username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // خطا در دسترسی به storage قابل چشم‌پوشی است
    }

    const success = await login(data);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => router.push('/dashboard'), 500);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" noValidate>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ borderRadius: 2, mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2, mb: 2.5 }}>
          ورود موفقیت‌آمیز بود
        </Alert>
      )}

      <TextField
        fullWidth
        label="نام کاربری / شماره موبایل"
        error={!!errors.username}
        helperText={errors.username?.message}
        disabled={isLoading}
        autoComplete="username"
        sx={fieldSx}
        {...register('username')}
      />

      <PasswordInput
        name="password"
        register={register('password')}
        error={errors.password}
        disabled={isLoading}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between" style={{ marginTop: '-4px', marginBottom: '20px' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={isLoading}
              sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#1976d2' } }}
            />
          }
          label={<span className="text-sm text-slate-600">مرا به خاطر بسپار</span>}
          sx={{ m: 0 }}
        />

        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
        >
          <KeyRound size={16} />
          رمز عبور را فراموش کرده‌اید؟
        </Link>
      </div>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
        sx={{
          borderRadius: 2,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          color: '#ffffff',
          background: 'linear-gradient(135deg, #1E2A4F 0%, #1976d2 100%)',
          boxShadow: '0 8px 20px -6px rgba(25, 118, 210, 0.6)',
          transition: 'transform .15s ease, box-shadow .2s ease',
          '&:hover': {
            boxShadow: '0 12px 26px -6px rgba(25, 118, 210, 0.7)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': {
            background: 'linear-gradient(135deg, #1E2A4F 0%, #1976d2 100%)',
            color: '#ffffff',
            opacity: 0.7,
          },
        }}
      >
        {isLoading ? 'در حال ورود...' : 'ورود'}
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        حساب کاربری ندارید؟{' '}
        <Link href="/auth/register" className="font-semibold text-sky-600 hover:text-sky-700">
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}
