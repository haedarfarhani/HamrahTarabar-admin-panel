/**
 * ترجمه پیام‌های انگلیسی بک‌اند (AdminUsers / Auth) به فارسی.
 *
 * تنها منبع حقیقت برای نگاشت خطاهای ثبت‌نام ادمین و لاگین کاربر غیرفعال؛
 * اگر متن بک‌اند تغییر کرد فقط همین فایل به‌روزرسانی می‌شود.
 */

/** POST /api/v1/auth/login برای کاربر غیرفعال 401 با این خطا برمی‌گرداند */
export const INACTIVE_ACCOUNT_ERROR =
  'Account is not active. Please wait until an admin activates your account.';

const ERROR_MAP: Record<string, string> = {
  // POST /api/v1/AdminUsers/register → 400
  'Phone number already registered.': 'این شماره موبایل قبلاً ثبت شده است.',
  'Username already exists.': 'این نام کاربری قبلاً ثبت شده است.',
  'Invalid user type.': 'نوع کاربر نامعتبر است.',
  // POST /api/v1/auth/login → 401 برای کاربر غیرفعال (IsActive=false)
  [INACTIVE_ACCOUNT_ERROR]: 'حساب شما هنوز فعال نشده است؛ در انتظار تایید ادمین.',
  // 403 — کاربر بدون رول/مجوز مجاز
  'The authenticated user is not allowed to perform this action.': 'شما اجازهٔ انجام این عملیات را ندارید.',
  // 401 — احراز هویت
  'Authentication is required.': 'ابتدا وارد حساب خود شوید.',
  'Invalid username or password.': 'نام کاربری یا رمز عبور اشتباه است.',
  // 429
  'The request rate limit was reached.': 'تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
  'You have reached the rate limit. Please try again later.': 'تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
  // 404 — موارد یافت‌نشده
  'User not found.': 'کاربر یافت نشد.',
  'Role not found.': 'نقش یافت نشد.',
  'Permission not found.': 'دسترسی یافت نشد.',
  'Cargo not found.': 'بار یافت نشد.',
  // 500 — خطای عمومی
  'An error occurred while processing your request.': 'در پردازش درخواست خطایی رخ داد.',
};

/**
 * نگاشت errorCodeهای پایدار بک‌اند (code/errorCode) به پیام فارسی.
 * وقتی متن خام بک‌اند قابل ترجمه نیست ولی کد ماشین‌خوان موجود است، از این استفاده می‌شود.
 */
const ERROR_CODE_MAP: Record<string, string> = {
  FORBIDDEN: 'شما اجازهٔ انجام این عملیات را ندارید.',
  UNAUTHORIZED: 'نشست شما منقضی شده است؛ لطفاً دوباره وارد شوید.',
  VALIDATION_ERROR: 'داده‌های ارسالی نامعتبر است؛ ورودی‌ها را بررسی کنید.',
  NOT_FOUND: 'خواستهٔ مورد نظر یافت نشد.',
  CONFLICT: 'درخواست با وضعیت فعلی در تضاد است.',
  TOO_MANY_REQUESTS: 'تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
  INTERNAL_SERVER_ERROR: 'خطای داخلی سرور؛ کمی بعد دوباره تلاش کنید.',
};

/**
 * خطای خام بک‌اند (errors[0] یا message) را به فارسی برمی‌گرداند؛
 * اگر نگاشتی پیدا نشود همان متن اصلی برگردانده می‌شود.
 */
export function translateBackendError(raw?: string | null): string {
  if (!raw) return 'خطای نامشخص از سمت سرور';
  const trimmed = raw.trim();
  return ERROR_MAP[trimmed] ?? trimmed;
}

/** استخراج پیام نمایشی از خطای پرتاب‌شده توسط api.ts (شکل { errors?, message?, status?, code?, errorCode? }) */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  const error = err as {
    message?: string;
    errors?: string[];
    status?: number;
    code?: string;
    errorCode?: string;
  };
  const raw = error.errors?.[0] || error.message;
  if (raw) {
    const translated = translateBackendError(raw);
    // اگر متن خام قابل ترجمه بود همان را بده؛ وگرنه از کد ماشین‌خوان استفاده کن
    if (translated !== raw) return translated;
  }
  const code = error.errorCode || error.code;
  if (code && ERROR_CODE_MAP[code]) return ERROR_CODE_MAP[code];
  if (error.status === 403) return 'شما اجازهٔ انجام این عملیات را ندارید.';
  if (error.status === 401) return 'نشست شما منقضی شده است؛ لطفاً دوباره وارد شوید.';
  return raw || fallback;
}
