'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Alert, CircularProgress } from '@mui/material';
import { LogIn, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/app/lib/auth-store';
import PasswordInput from './PasswordInput';

const loginSchema = z.object({
  username: z.string().min(1, 'نام کاربری الزامی است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'white',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.87)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1976d2',
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    color: 'rgba(0, 0, 0, 0.87)',
    padding: '14px 16px',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0, 0, 0, 0.6)',
    '&.Mui-focused': {
      color: '#1976d2',
    },
  },
};

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl">
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ borderRadius: 2, mb: 3 }}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2, mb: 3 }}>
          ورود موفقیت‌آمیز بود
        </Alert>
      )}

      <div style={{ marginBottom: '20px' }}>
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
      </div>

      <div style={{ marginBottom: '20px' }}>
        <PasswordInput
          name="password"
          register={register('password')}
          error={errors.password}
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>

      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <Link
          href="/auth/forgot-password"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          <KeyRound size={16} />
          رمز عبور را فراموش کرده‌اید؟
        </Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
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
            boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(25, 118, 210, 0.5)',
            },
          }}
        >
          {isLoading ? 'در حال ورود...' : 'ورود'}
        </Button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          حساب کاربری ندارید؟{' '}
          <Link
            href="/auth/register"
            style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
          >
            ثبت‌نام کنید
          </Link>
        </span>
      </div>
    </form>
  );
}
