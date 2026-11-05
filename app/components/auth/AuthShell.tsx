'use client';

import type { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Truck, ShieldCheck, Headphones, type LucideIcon } from 'lucide-react';
import BrandLogo from '@/app/components/brand/BrandLogo';

/**
 * تم روشن مخصوص صفحه‌های احراز هویت.
 * صفحه‌های ورود/ثبت‌نام بازطراحی‌شده روشن هستند؛ با این تم تضادی،
 * رنگ پیش‌فرض متن متناسب با حالت روشن/تیره کاربر تغییر نمی‌کند
 * و متن فیلدها همیشه روی پس‌زمینه سفید خوانا می‌ماند.
 */
const authTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: 'Vazirmatn, Arial, sans-serif',
  },
  direction: 'rtl',
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const CARD_SHADOW = '0 30px 70px -25px rgba(15, 23, 42, 0.45)';
const BRAND_GRADIENT = 'linear-gradient(155deg, #1E2A4F 0%, #1d4ed8 62%, #2563eb 100%)';

type BrandFeature = { icon: LucideIcon; text: string };

/** نکات مزیتی پیش‌فرض پنل کناری (کنار فرم) */
const DEFAULT_BRAND_FEATURES: BrandFeature[] = [
  { icon: Truck, text: 'ثبت، پیگیری و مدیریت بار در هر لحظه' },
  { icon: ShieldCheck, text: 'امنیت کامل اطلاعات و حساب کاربری شما' },
  { icon: Headphones, text: 'پشتیبانی شبانه‌روزی در سراسر مسیر' },
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  /** حداکثر عرض کارت به پیکسل (فقط در چیدمان centered) */
  width?: number;
  /**
   * centered: کارت تک‌ستونه (ورود / فراموشی رمز)
   * split: کارت دو ستونه «پنل برند + فرم» برای صفحه‌های پرمحتوا مانند ثبت‌نام.
   *        کارت دقیقاً اندازه‌ی viewport می‌شود، صفحه اسکرول نمی‌گیرد
   *        و فرم در دو ستون چیده می‌شود.
   */
  variant?: 'centered' | 'split';
  /** برچسب کوچک بالای عنوان فرم (مثلاً «ویژه کاربران پشتیبانی») */
  badge?: string;
  /** زیر‌عنوان کنار لوگو در پنل کناری */
  asideSubtitle?: string;
  /** عنوان و توضیح پنل کناری در چیدمان split */
  asideTitle?: string;
  asideDescription?: string;
  asideFeatures?: BrandFeature[];
  asideNote?: string;
  children: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  width = 440,
  variant = 'centered',
  badge,
  asideSubtitle,
  asideTitle,
  asideDescription,
  asideFeatures,
  asideNote,
  children,
}: AuthShellProps) {
  return (
    <ThemeProvider theme={authTheme}>
      {variant === 'split' ? (
        <SplitLayout
          title={title}
          subtitle={subtitle}
          badge={badge}
          asideSubtitle={asideSubtitle}
          asideTitle={asideTitle}
          asideDescription={asideDescription}
          asideFeatures={asideFeatures}
          asideNote={asideNote}
        >
          {children}
        </SplitLayout>
      ) : (
        <CenteredLayout title={title} subtitle={subtitle} width={width}>
          {children}
        </CenteredLayout>
      )}
    </ThemeProvider>
  );
}

/** پس‌زمینه‌ی مشترک با حباب‌های رنگی محو */
function Background() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl"
      />
    </>
  );
}

function CenteredLayout({
  title,
  subtitle,
  width,
  children,
}: {
  title: string;
  subtitle: string;
  width: number;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      <Background />

      <div className="relative w-full" style={{ maxWidth: `${width}px` }}>
        <div
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
          style={{ boxShadow: '0 24px 60px -20px rgba(15, 23, 42, 0.25)' }}
        >
          {/* هدر */}
          <div
            className="relative px-8 pb-8 pt-9 text-center"
            style={{ background: 'linear-gradient(135deg, #1E2A4F 0%, #1d4ed8 55%, #2563eb 100%)' }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 25% 0%, rgba(255, 255, 255, 0.4) 0%, transparent 55%)',
              }}
            />
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <BrandLogo variant="white" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm text-blue-100">{subtitle}</p>
          </div>

          {/* بدنه فرم */}
          <div className="px-7 pb-8 pt-7">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; 2026 همراه ترابر &mdash; تمامی حقوق محفوظ است
        </p>
      </div>
    </div>
  );
}

/**
 * چیدمان دو ستونه: فرم در سمت راست (شروع راست‌چین) و پنل برند در سمت چپ.
 * کل صفحه `100dvh` و `overflow-hidden` است تا هیچ اسکرولی ایجاد نشود؛
 * ستون فرم در صورت کمبود فضا (مثل موبایل) به‌صورت داخلی اسکرول می‌شود.
 */
function SplitLayout({
  title,
  subtitle,
  badge,
  asideTitle = 'از ثبت‌نام تا تحویل بار، همراه شما هستیم',
  asideDescription = 'با ساخت حساب کاربری به پنل مدیریت بار دسترسی پیدا می‌کنید و می‌توانید بارها، رانندگان و سفارش‌های خود را یک‌جا مدیریت کنید.',
  asideFeatures = DEFAULT_BRAND_FEATURES,
  asideNote,
  asideSubtitle = 'پنل مدیریت حمل‌ونقل',
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  asideTitle?: string;
  asideDescription?: string;
  asideFeatures?: BrandFeature[];
  asideNote?: string;
  asideSubtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Background />

      <div
        className="relative grid h-full w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white md:grid-cols-[1.05fr_1fr]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* ستون فرم — در RTL اولین ستون، سمت راست کارت است */}
        <div className="flex min-h-0 flex-col overflow-y-auto">
          {/* m-auto به‌جای justify-center: اگر ارتفاع محتوا از پنل بیشتر شود،
              بالای فرم بریده نمی‌شود و قابل دسترسی می‌ماند */}
          <div className="m-auto w-full max-w-[560px] px-5 py-5 sm:px-9 sm:py-6">
            <header className="mb-4">
              <div className="mb-3 flex items-center gap-3 md:hidden">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: BRAND_GRADIENT }}
                >
                  <BrandLogo variant="white" size={24} />
                </span>
                <span className="text-sm font-bold text-slate-700">همراه ترابر</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">{title}</h1>
                {badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 ring-inset">
                    <ShieldCheck size={13} strokeWidth={2.4} />
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
            </header>

            {children}
          </div>
        </div>

        {/* ستون برند — در RTL سمت چپ کارت */}
        <aside
          className="relative hidden min-h-0 flex-col justify-between overflow-hidden p-8 text-white md:flex lg:p-9"
          style={{ background: BRAND_GRADIENT }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-sky-300/20 blur-2xl"
          />

          {/* لوگو */}
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <BrandLogo variant="white" size={24} />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold">همراه ترابر</p>
              <p className="text-xs text-blue-100/80">{asideSubtitle}</p>
            </div>
          </div>

          {/* متن معرفی + مزایا */}
          <div className="relative my-6">
            <h2 className="text-2xl font-extrabold leading-9">{asideTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">{asideDescription}</p>

            <ul className="mt-6 space-y-3.5">
              {asideFeatures.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-white/95">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <Icon size={15} strokeWidth={2.2} />
                  </span>
                  <span className="leading-6">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {asideNote && (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs leading-6 text-blue-50 backdrop-blur">
                {asideNote}
              </div>
            )}
            <p className="mt-4 text-center text-[11px] text-blue-100/70">
              &copy; 2026 همراه ترابر &mdash; تمامی حقوق محفوظ است
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
