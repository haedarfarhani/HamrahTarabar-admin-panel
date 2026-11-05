'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/app/lib/auth-store';
import { getProvinces, getCitiesByProvince, getUserTypes } from '@/app/lib/api';
import { ProvinceDto, CityDto, UserTypeDto } from '@/app/types/api';
import { toUserTypeOptions, FALLBACK_USER_TYPES, UserTypeOption } from '@/app/lib/user-types';
import PasswordInput from './PasswordInput';
import { gridFieldSx } from './fieldStyles';
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from '@/app/lib/password';

/* محدودیت‌های طول با RegisterDto در بک‌اند هم‌تراز است تا کاربر به‌جای خطای
   انگلیسی سرور، پیام فارسی همان قاعده را ببیند (username: 3-50، نام: 2-50،
   رمز: 8-100، استان/شهر: 2-50). */
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
      .max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد'),
    lastName: z
      .string()
      .min(2, 'نام خانوادگی باید حداقل ۲ کاراکتر باشد')
      .max(50, 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد'),
    phoneNumber: z
      .string()
      .min(1, 'شماره موبایل الزامی است')
      .max(15, 'شماره موبایل نباید بیشتر از ۱۵ کاراکتر باشد')
      .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است (مثال: 09123456789)'),
    livingProvince: z
      .string()
      .min(2, 'استان محل سکونت الزامی است')
      .max(50, 'استان محل سکونت نباید بیشتر از ۵۰ کاراکتر باشد'),
    livingCity: z
      .string()
      .min(2, 'شهر محل سکونت الزامی است')
      .max(50, 'شهر محل سکونت نباید بیشتر از ۵۰ کاراکتر باشد'),
    userTypeId: z.string().min(1, 'نوع کاربری الزامی است'),
    username: z
      .string()
      .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
      .max(50, 'نام کاربری نباید بیشتر از ۵۰ کاراکتر باشد'),
    password: z
      .string()
      .min(1, 'رمز عبور الزامی است')
      .max(100, 'رمز عبور نباید بیشتر از ۱۰۰ کاراکتر باشد')
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
    confirmPassword: z.string().min(1, 'تکرار رمز عبور الزامی است'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [cities, setCities] = useState<CityDto[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceDto | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityDto | null>(null);
  // نوع‌های کاربری از GET /api/v1/UserTypes (بدون ادمین در خود-ثبت‌نام عمومی)؛
  // تا زمان دیپلوی endpoint از لیست جایگزین استفاده می‌شود.
  const [userTypeOptions, setUserTypeOptions] = useState<UserTypeOption[]>(() =>
    toUserTypeOptions(FALLBACK_USER_TYPES, true)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    resetField,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    /* استان/شهر با setValue پر می‌شوند و register نمی‌شوند؛ بدون مقدار پیش‌فرض،
       zod به‌جای پیام فارسی، «Invalid input» نشان می‌دهد (undefined نه string). */
    defaultValues: { userTypeId: '', livingProvince: '', livingCity: '' },
  });

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await getProvinces();
        if (res.success && res.data) {
          setProvinces(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoadingProvinces(false);
      }
    };
    const fetchUserTypes = async () => {
      try {
        const res = await getUserTypes();
        const live: UserTypeDto[] | undefined = res.success ? res.data ?? undefined : undefined;
        if (live && live.length > 0) setUserTypeOptions(toUserTypeOptions(live, true));
      } catch {
        // ignore — لیست جایگزین باقی می‌ماند
      }
    };
    fetchProvinces();
    fetchUserTypes();
  }, []);

  useEffect(() => {
    /* بازنشانی شهر در onChange استان انجام می‌شود تا داخل افکت setState نزنیم */
    if (!selectedProvince) return;

    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity(null);
      resetField('livingCity');
      try {
        /* لیست شهرها با شناسه‌ی استان گرفته می‌شود، ولی مقدار فرم livingProvince
           نام استان است (چیزی که بک‌اند ذخیره می‌کند). */
        const res = await getCitiesByProvince(selectedProvince.id);
        if (res.success && res.data) {
          setCities(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvince, resetField]);

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const success = await registerUser(data);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
  };

  /** متن خطای فیلد یا یک فاصله برای رزرو همیشگی فضای متن کمکی */
  const helper = (message?: string) => message ?? ' ';

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" noValidate>
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ borderRadius: 2, py: 0.25, mb: 2, fontSize: 13 }}
        >
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2, py: 0.25, mb: 2, fontSize: 13 }}>
          ثبت‌نام موفقیت‌آمیز بود
        </Alert>
      )}

      {/* فرم دو ستونه تا همه فیلدها بدون اسکرول در صفحه جا شوند */}
      <div className="grid grid-cols-2 gap-x-3">
        <TextField
          fullWidth
          label="نام"
          error={!!errors.firstName}
          helperText={helper(errors.firstName?.message)}
          disabled={isLoading}
          sx={gridFieldSx}
          {...register('firstName')}
        />

        <TextField
          fullWidth
          label="نام خانوادگی"
          error={!!errors.lastName}
          helperText={helper(errors.lastName?.message)}
          disabled={isLoading}
          sx={gridFieldSx}
          {...register('lastName')}
        />

        <TextField
          fullWidth
          label="شماره موبایل"
          placeholder="09123456789"
          error={!!errors.phoneNumber}
          helperText={helper(errors.phoneNumber?.message)}
          disabled={isLoading}
          dir="ltr"
          slotProps={{ htmlInput: { dir: 'ltr', style: { textAlign: 'left' } } }}
          sx={gridFieldSx}
          {...register('phoneNumber')}
        />

        <TextField
          fullWidth
          label="نام کاربری"
          error={!!errors.username}
          helperText={helper(errors.username?.message)}
          disabled={isLoading}
          autoComplete="username"
          sx={gridFieldSx}
          {...register('username')}
        />

        <PasswordInput
          compact
          label="رمز عبور"
          name="password"
          register={register('password')}
          error={errors.password}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <PasswordInput
          compact
          label="تکرار رمز عبور"
          name="confirmPassword"
          register={register('confirmPassword')}
          error={errors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <Autocomplete
          options={provinces}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={loadingProvinces}
          disabled={isLoading}
          value={selectedProvince}
          onChange={(_, newValue) => {
            setSelectedProvince(newValue);
            /* با تغییر استان، شهر انتخاب‌شده و لیست شهرهای قبلی بی‌اعتبار می‌شوند */
            setCities([]);
            setSelectedCity(null);
            resetField('livingCity');
            /* بک‌اند استان/شهر را به‌صورت نام ذخیره می‌کند (نه شناسه) — مثل کاربر ادمین که
               مقدار livingProvince آن «Tehran» است؛ پس نام انتخاب‌شده ارسال می‌شود. */
            setValue('livingProvince', newValue?.name || '', { shouldValidate: true });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="استان محل سکونت"
              error={!!errors.livingProvince}
              helperText={helper(errors.livingProvince?.message)}
            />
          )}
          sx={gridFieldSx}
        />

        <Autocomplete
          options={cities}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={loadingCities}
          disabled={isLoading || !selectedProvince}
          value={selectedCity}
          onChange={(_, newValue) => {
            setSelectedCity(newValue);
            setValue('livingCity', newValue?.name || '', { shouldValidate: true });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="شهر محل سکونت"
              error={!!errors.livingCity}
              helperText={helper(errors.livingCity?.message)}
            />
          )}
          sx={gridFieldSx}
        />

        <TextField
          fullWidth
          select
          label="نوع کاربری"
          /* مقدار پیش‌فرض خالی تا MUI هشدار selected value خارج از بازه ندهد */
          defaultValue=""
          error={!!errors.userTypeId}
          helperText={helper(errors.userTypeId?.message)}
          disabled={isLoading}
          sx={gridFieldSx}
          className="col-span-2"
          {...register('userTypeId')}
        >
          {userTypeOptions.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <UserPlus size={20} />}
        sx={{
          mt: 2.5,
          borderRadius: 2,
          py: 1.35,
          fontSize: '1rem',
          fontWeight: 600,
          color: '#ffffff',
          background: 'linear-gradient(135deg, #1E2A4F 0%, #1976d2 100%)',
          boxShadow: '0 8px 20px -6px rgba(25, 118, 210, 0.6)',
          transition: 'transform .15s ease, box-shadow .2s ease',
          '&:hover': {
            boxShadow: '0 12px 26px -6px rgba(25, 118, 210, 0.7)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': {
            background: 'linear-gradient(135deg, #1E2A4F 0%, #1976d2 100%)',
            color: '#ffffff',
            opacity: 0.7,
          },
        }}
      >
        {isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
      </Button>

      <p className="mt-4 text-center text-sm text-slate-500">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link href="/auth/login" className="font-semibold text-sky-600 hover:text-sky-700">
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
