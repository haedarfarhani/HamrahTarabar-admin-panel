/**
 * آیکون برند «همراه ترابر».
 *
 * سه نسخه از یک آیکون در `public` نگهداری می‌شود تا رنگ‌ها در همه‌جا
 * یکسان بمانند:
 *   - brand-logo.svg        نسخه رنگی برند (سرمه‌ای + نارنجی)
 *   - brand-logo-white.svg  نسخه سفید برای پس‌زمینه‌های رنگی
 *   - brand-logo-gray.svg   نسخه خاکستری برای placeholder تصاویر
 *
 * هر جای پنل که به لوگو یا آیکون برند نیاز باشد از این کامپوننت استفاده
 * می‌کند و هر جای که تصویری هنوز لود نشده/موجود نیست از `BrandPlaceholder`.
 */

export type BrandLogoVariant = 'color' | 'white' | 'gray';

const LOGO_SRC: Record<BrandLogoVariant, string> = {
  color: '/brand-logo.svg',
  white: '/brand-logo-white.svg',
  gray: '/brand-logo-gray.svg',
};

export interface BrandLogoProps {
  /** اندازه ضلع به پیکسل */
  size?: number;
  /** نسخه رنگی، سفید (روی پس‌زمینه رنگی) یا خاکستری (placeholder) */
  variant?: BrandLogoVariant;
  className?: string;
  style?: React.CSSProperties;
}

export default function BrandLogo({
  size = 40,
  variant = 'color',
  className,
  style,
}: BrandLogoProps) {
  return (
    // آیکون‌ها SVG محلی و کاملاً قابل‌اعتماد هستند؛ next/image برای SVG
    // نیاز به dangerouslyAllowSVG دارد و اینجا لازم نیست.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC[variant]}
      alt="همراه ترابر"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
    />
  );
}

/**
 * جایگزین تصویر (placeholder): همان آیکون برند، اما خاکستری.
 * برای آواتار، تصویر بار و هر تصویری که بارگذاری نشده یا خالی است.
 */
export function BrandPlaceholder({
  size = 40,
  className,
  style,
}: Omit<BrandLogoProps, 'variant'>) {
  return (
    <BrandLogo
      variant="gray"
      size={size}
      className={className}
      style={{ borderRadius: '50%', ...style }}
    />
  );
}
