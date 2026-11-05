import { UserTypeDto } from '@/app/types/api';

/**
 * منبع واحد کار با نوع‌های کاربری در فرانت.
 *
 * منبع اصلی: GET /api/v1/UserTypes (عمومی، فقط نوع‌های فعال).
 * هیچ GUID هاردکدی در فرم‌ها استفاده نمی‌شود — لیست از همین endpoint خوانده می‌شود.
 */

export interface UserTypeOption {
  id: string;
  label: string;
}

/**
 * الگوی GUID سازگار با model binding بک‌اند (System.Guid).
 * توجه: از z.string().uuid() استفاده نکنید — zod نسخه ۴ variant/version
 * استاندارد RFC را اجباری می‌کند و GUIDهای seed بک‌اند را رد می‌کند،
 * در حالی که بک‌اند آن‌ها را معتبر می‌داند.
 */
export const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** نگاشت نام انگلیسی نوع کاربر به لیبل فارسی نمایشی */
const USER_TYPE_FA_LABELS: Record<string, string> = {
  administrator: 'پشتیبانی / ادمین',
  driver: 'راننده',
  loadowner: 'صاحب بار',
  support: 'پشتیبانی',
  company: 'شرکت',
};

/** لیبل نمایشی یک نوع کاربر (فارسی در صورت شناخته‌شده، وگرنه همان name بک‌اند) */
export function getUserTypeLabel(name?: string | null): string {
  if (!name) return '-';
  return USER_TYPE_FA_LABELS[name.toLowerCase()] ?? name;
}

/** آیا این رکورد، نوع «ادمین» است؟ (مبنای نام، نه GUID هاردکد) */
export function isAdministratorType(type: Pick<UserTypeDto, 'name'>): boolean {
  return type.name?.toLowerCase() === 'administrator';
}

/**
 * ساخت گزینه‌های دراپ‌داون از خروجی API.
 * @param excludeAdmin برای فرم خود-ثبت‌نام عمومی که نباید گزینه‌ی ادمین داشته باشد
 */
export function toUserTypeOptions(types: UserTypeDto[], excludeAdmin = false): UserTypeOption[] {
  return types
    .filter((t) => t?.id && t?.name && (!excludeAdmin || !isAdministratorType(t)))
    .map((t) => ({ id: t.id, label: getUserTypeLabel(t.name) }));
}

/**
 * لیست جایگزینِ فقط-برای-شرایط-اضطراری، تا زمانی که GET /UserTypes روی
 * بک‌اند دیپلوی شود (فعلاً 404 می‌دهد). به‌محض زنده شدن endpoint، داده‌ی
 * زنده جایگزین می‌شود و این مقادیر استفاده نمی‌شوند.
 */
export const FALLBACK_USER_TYPES: UserTypeDto[] = [
  { id: '60000000-0000-0000-0000-600000000000', name: 'Administrator', panelRoute: '/admin/dashboard' },
  { id: '70000000-0000-0000-0000-700000000000', name: 'Driver' },
  { id: '80000000-0000-0000-0000-800000000000', name: 'LoadOwner' },
];
