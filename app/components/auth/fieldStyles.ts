import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';

/**
 * سبک پایه فیلدهای متنی احراز هویت.
 * رنگ متن ورودی صریحاً تعریف شده تا روی پس‌زمینه سفید همیشه خوانا باشد
 * و با تغییر حالت روشن/تیره تم، متن نامرئی نشود.
 */
const baseFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#cbd5e1',
      borderWidth: '1px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#94a3b8',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1976d2',
      borderWidth: '2px',
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d32f2f',
    },
    '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d32f2f',
    },
    '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d32f2f',
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    color: 'rgba(0, 0, 0, 0.87)',
  },
  '& .MuiInputAdornment-root': {
    color: '#64748b',
  },
  '& .MuiInputLabel-root': {
    color: '#475569',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#1976d2',
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: '#d32f2f',
  },
  '& .MuiFormHelperText-root': {
    color: '#64748b',
    /* فضای متن کمکی همیشه رزرو می‌شود تا ظاهر شدن خطاها
       باعث پرش چیدمان و اسکرول صفحه نشود */
    minHeight: '16px',
    margin: '3px 14px 3px',
    fontSize: '12px',
    lineHeight: '14px',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: '#d32f2f',
  },
};

/** بدون فاصله عمودی — برای فیلد داخلی Autocomplete */
export const inputSx: SystemStyleObject<Theme> = baseFieldSx;

/** استایل استاندارد فیلد با فاصله عمودی یکسان در تمام فرم‌ها */
export const fieldSx: SystemStyleObject<Theme> = { ...baseFieldSx, mb: 2.5 };

/**
 * نسخه‌ی بدون حاشیه‌ی پایین، مخصوص فیلدهای داخل grid دو ستونه؛
 * فاصله‌ی سطرها را `gap` گرید تعیین می‌کند و `minWidth: 0`
 * مانع شکستن چیدمان دو ستونه می‌شود.
 */
export const gridFieldSx: SystemStyleObject<Theme> = { ...baseFieldSx, mb: 0, minWidth: 0 };
