'use client';

import { Headphones, LifeBuoy, ShieldCheck } from 'lucide-react';
import AuthShell from '@/app/components/auth/AuthShell';
import RegisterForm from '@/app/components/auth/RegisterForm';

/** مزیت‌های حساب پشتیبانی که در پنل کناری نمایش داده می‌شوند */
const SUPPORT_FEATURES = [
  { icon: Headphones, text: 'پاسخ‌گویی به کاربران و پیگیری درخواست‌ها' },
  { icon: ShieldCheck, text: 'دسترسی امن بر اساس نقش و سطح دسترسی تعیین‌شده' },
  { icon: LifeBuoy, text: 'مدیریت تیکت‌های پشتیبانی در یک پنل یکپارچه' },
];

export default function RegisterPage() {
  return (
    <AuthShell
      variant="split"
      badge="ویژه کاربران پشتیبانی"
      title="ثبت‌نام کاربر پشتیبانی"
      subtitle="فرم ثبت‌نام مخصوص کاربران پشتیبانی شرکت همراه ترابر است."
      asideSubtitle="پنل پشتیبانی"
      asideTitle="حساب پشتیبانی، کلید رسیدگی سریع به کاربران"
      asideDescription="با ساخت حساب پشتیبانی می‌توانید درخواست‌های کاربران را پیگیری کنید، به تیکت‌ها پاسخ دهید و وضعیت بارها را بررسی کنید."
      asideFeatures={SUPPORT_FEATURES}
      asideNote="دسترسی این حساب بر اساس نقش و سطح دسترسی‌ای که مدیر تعیین می‌کند فعال می‌شود."
    >
      <RegisterForm />
    </AuthShell>
  );
}
