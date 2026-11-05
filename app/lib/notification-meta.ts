import type { ElementType } from 'react';
import {
  LocalShipping as CargoIcon,
  Handshake as RequestIcon,
  SupportAgent as SupportIcon,
  RateReview as ReviewIcon,
  Person as UserIcon,
  DirectionsCar as DriverIcon,
  Notifications as GenericIcon,
  Campaign as CampaignIcon,
  Payments as PaymentIcon,
  ReportProblem as WarningIcon,
} from '@mui/icons-material';
import type { NotificationAlertStatus } from '@/app/lib/api';

export const faNum = (value: number) => value.toLocaleString('fa-IR');

/* ───────── وضعیت تحویل ───────── */

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatusMeta {
  label: string;
  tone: Tone;
  color: string;
  description: string;
}

export const NOTIFICATION_STATUS_META: Record<NotificationAlertStatus, StatusMeta> = {
  Pending: {
    label: 'در صف',
    tone: 'info',
    color: '#0288d1',
    description: 'اعلان در صف ارسال منتظر پردازش است.',
  },
  Processing: {
    label: 'در حال ارسال',
    tone: 'warning',
    color: '#ed6c02',
    description: 'ارسال اعلان توسط ورکر در حال انجام است.',
  },
  Delivered: {
    label: 'ارسال‌شده',
    tone: 'success',
    color: '#2e7d32',
    description: 'OneSignal درخواست ارسال را پذیرفت.',
  },
  Failed: {
    label: 'ناموفق',
    tone: 'error',
    color: '#d32f2f',
    description: 'ارسال اعلان با خطا مواجه شد و در صف تلاش مجدد است.',
  },
  Suppressed: {
    label: 'سرکوب‌شده',
    tone: 'default',
    color: '#616161',
    description: 'ارسال این اعلان عمداً انجام نشد (مثلاً مقصد غیرفعال است).',
  },
};

const FALLBACK_STATUS_META: StatusMeta = {
  label: 'نامشخص',
  tone: 'default',
  color: '#616161',
  description: 'وضعیت این اعلان در سیستم ثبت نشده است.',
};

export function getStatusMeta(status?: string | null): StatusMeta {
  if (!status) return FALLBACK_STATUS_META;
  const key = status.trim() as NotificationAlertStatus;
  return NOTIFICATION_STATUS_META[key] ?? { ...FALLBACK_STATUS_META, label: status };
}

/* ───────── اپلیکیشن هدف ───────── */

export interface TargetAppMeta {
  label: string;
  color: string;
  icon: ElementType;
}

export const TARGET_APP_META: Record<string, TargetAppMeta> = {
  Driver: { label: 'راننده', color: '#1565c0', icon: DriverIcon },
  CargoOwner: { label: 'صاحب بار', color: '#ef6c00', icon: CargoIcon },
  Admin: { label: 'مدیریت', color: '#6a1b9a', icon: CampaignIcon },
};

export function getTargetAppMeta(targetApp?: string | null): TargetAppMeta {
  if (!targetApp) {
    return { label: 'نامشخص', color: '#616161', icon: GenericIcon };
  }
  return (
    TARGET_APP_META[targetApp] ?? {
      label: targetApp,
      color: '#616161',
      icon: GenericIcon,
    }
  );
}

/* ───────── دسته‌بندی رویداد (typeCode) ───────── */

export interface EventMeta {
  label: string;
  color: string;
  icon: ElementType;
}

/** دامنه‌ی اول typeCode، مثلاً «Cargo» در «Cargo.Published.Driver» */
const DOMAIN_META: Record<string, EventMeta> = {
  cargo: { label: 'بار', color: '#ef6c00', icon: CargoIcon },
  request: { label: 'پیشنهاد', color: '#1565c0', icon: RequestIcon },
  support: { label: 'پشتیبانی', color: '#6a1b9a', icon: SupportIcon },
  review: { label: 'نظر', color: '#00897b', icon: ReviewIcon },
  user: { label: 'کاربر', color: '#2e7d32', icon: UserIcon },
  driver: { label: 'راننده', color: '#1565c0', icon: DriverIcon },
  payment: { label: 'پرداخت', color: '#ad1457', icon: PaymentIcon },
  system: { label: 'سامانه', color: '#455a64', icon: WarningIcon },
};

/** رویداد دوم typeCode */
const EVENT_LABELS: Record<string, string> = {
  published: 'انتشار',
  created: 'ایجاد',
  accepted: 'پذیرش',
  rejected: 'رد',
  cancelled: 'لغو',
  completed: 'تکمیل',
  expired: 'انقضا',
  assigned: 'تخصیص',
  approved: 'تأیید',
  pending: 'در انتظار',
  registered: 'ثبت‌نام',
  updated: 'به‌روزرسانی',
  replied: 'پاسخ',
  rated: 'امتیازدهی',
  reviewed: 'بررسی',
  failed: 'ناموفق',
  delivered: 'ارسال',
  sent: 'ارسال',
};

export interface TypeCodeMeta extends EventMeta {
  /** برچسب کامل، مثلاً «بار · انتشار» */
  title: string;
  domainLabel: string;
  eventLabel: string;
  targetLabel: string;
}

export function getTypeCodeMeta(typeCode?: string | null): TypeCodeMeta {
  const segments = (typeCode ?? '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);

  const domainKey = (segments[0] ?? '').toLowerCase();
  const eventKey = (segments[1] ?? '').toLowerCase();
  const targetKey = segments[2] ?? '';

  const domain = DOMAIN_META[domainKey] ?? {
    label: segments[0] ?? 'اعلان',
    color: '#455a64',
    icon: GenericIcon,
  };

  const eventLabel = EVENT_LABELS[eventKey] ?? (segments[1] ?? '');
  const target = getTargetAppMeta(targetKey);

  const titleParts = [domain.label, eventLabel].filter(Boolean).join(' · ');

  return {
    label: titleParts || domain.label,
    title: titleParts || 'اعلان',
    color: domain.color,
    icon: domain.icon,
    domainLabel: domain.label,
    eventLabel,
    targetLabel: target.label,
  };
}

/** نگاشت kind اعلان‌های داشبورد مدیریتی به ظاهر بصری */
export const DASHBOARD_KIND_META: Record<string, EventMeta> = {
  cargo: { label: 'بار', color: '#ef6c00', icon: CargoIcon },
  request: { label: 'پیشنهاد', color: '#1565c0', icon: RequestIcon },
  support: { label: 'پشتیبانی', color: '#6a1b9a', icon: SupportIcon },
  review: { label: 'نظر', color: '#00897b', icon: ReviewIcon },
};

export function getDashboardKindMeta(kind?: string | null): EventMeta {
  const key = (kind ?? '').toLowerCase();
  return (
    DASHBOARD_KIND_META[key] ?? {
      label: 'اعلان',
      color: '#455a64',
      icon: GenericIcon,
    }
  );
}

/* ───────── تاریخ و زمان ───────── */

const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatFaDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatFaDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${dateFormatter.format(date)} — ساعت ${timeFormatter.format(date)}`;
}

/** زمان نسبی فارسی، مثلاً «۱۲ دقیقه پیش» */
export function relativeTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (diffMs < 0) return 'در آینده';
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return `${faNum(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${faNum(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${faNum(days)} روز پیش`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${faNum(months)} ماه پیش`;

  return `${faNum(Math.floor(months / 12))} سال پیش`;
}

/** payload ساختاریافته را به کلید/مقدار خوانا تبدیل می‌کند */
export function parsePayload(payload?: string | null): Record<string, string> | null {
  if (!payload) return null;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const result: Record<string, string> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      result[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    });
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export const PAYLOAD_LABELS: Record<string, string> = {
  cargoId: 'شناسه بار',
  cargoLoadId: 'شناسه بار',
  requestId: 'شناسه پیشنهاد',
  requestCargoId: 'شناسه بار پیشنهاد',
  supportConversationId: 'شناسه گفتگو',
  reviewId: 'شناسه نظر',
  userId: 'شناسه کاربر',
  driverId: 'شناسه راننده',
  event: 'رویداد',
  reason: 'دلیل',
  amount: 'مبلغ',
  city: 'شهر',
  province: 'استان',
};

export function getPayloadLabel(key: string): string {
  return PAYLOAD_LABELS[key] ?? key;
}
