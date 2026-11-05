'use client';

import AuthShell from '@/app/components/auth/AuthShell';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell title="ورود به پنل" subtitle="خوش آمدید! لطفاً وارد حساب خود شوید">
      <LoginForm />
    </AuthShell>
  );
}
