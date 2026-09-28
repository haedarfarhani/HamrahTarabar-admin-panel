'use client';

import { Lock } from 'lucide-react';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div
          className="bg-white shadow-xl shadow-slate-200/50 overflow-hidden"
          style={{
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              padding: '32px 32px 24px',
              textAlign: 'center',
            }}
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Lock className="text-white" style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 className="text-2xl font-bold text-white">ورود به پنل</h1>
            <p className="mt-2 text-sm text-blue-100">
              خوش آمدید! لطفاً وارد حساب خود شوید
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '28px 32px 32px' }}>
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; 2026 همراه ترابر &mdash; تمامی حقوق محفوظ است
        </p>
      </div>
    </div>
  );
}
