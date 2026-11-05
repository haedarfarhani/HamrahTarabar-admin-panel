'use client';

import AuthShell from '@/app/components/auth/AuthShell';
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="بازیابی رمز عبور" subtitle="رمز عبور خود را بازیابی کنید" width={460}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
