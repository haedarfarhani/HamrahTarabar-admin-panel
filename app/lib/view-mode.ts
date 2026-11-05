import { useEffect, useState } from 'react';

export type CargoViewMode = 'list' | 'grid2' | 'grid3';

const VALID_MODES: CargoViewMode[] = ['list', 'grid2', 'grid3'];

const STORAGE_PREFIX = 'cargo-view-mode:';

/**
 * حالت نمایش کارت‌های بار (سطری / دو ستونه / سه ستونه) را در localStorage نگه می‌دارد؛
 * چون مبتنی بر کلید صفحه است و در پارتیشن origin مرورگر ذخیره می‌شود،
 * با خروج یا ورود مجدد کاربر تنظیم قبلی برنمی‌گردد و حفظ می‌ماند.
 */
export function useCargoViewMode(pageKey: string): [CargoViewMode, (mode: CargoViewMode) => void] {
  const [mode, setMode] = useState<CargoViewMode>('list');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + pageKey) as CargoViewMode | null;
      if (stored && VALID_MODES.includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode(stored);
      }
    } catch {
      // دسترسی به storage در دسترس نیست؛ پیش‌فرض سطری
    }
  }, [pageKey]);

  const changeMode = (next: CargoViewMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_PREFIX + pageKey, next);
    } catch {
      // ذخیره ممکن نشد؛ حالت فقط برای همین بار معتبر است
    }
  };

  return [mode, changeMode];
}
