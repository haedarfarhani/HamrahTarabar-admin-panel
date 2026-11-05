'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { registerAdminUser, getProvinces, getCitiesByProvince, getUserTypes } from '@/app/lib/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from '@/app/lib/password';
import { ProvinceDto, CityDto, AdminRegisterDto, UserTypeDto } from '@/app/types/api';
import { toUserTypeOptions, FALLBACK_USER_TYPES, GUID_REGEX, UserTypeOption } from '@/app/lib/user-types';
import PasswordInput from '@/app/components/auth/PasswordInput';
import { gridFieldSx } from '@/app/components/auth/fieldStyles';

/**
 * ولیدیشن سمت کلاینت دقیقاً مطابق RegisterDto بک‌اند:
 * firstName/lastName (2-50)، phoneNumber ایرانی، livingProvince/livingCity (2-50)،
 * userTypeId (Guid)، username اختیاری (3-50، یکتا در سرور)،
 * password (min 8 + یک بزرگ+کوچک+عدد+@$!%*?&)، confirmPassword (== password).
 */
const adminRegisterSchema = z
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
    livingAddress: z
      .string()
      .max(200, 'آدرس نباید بیشتر از ۲۰۰ کاراکتر باشد')
      .optional(),
    userTypeId: z
      .string()
      .min(1, 'نوع کاربر الزامی است')
      .regex(GUID_REGEX, 'نوع کاربر نامعتبر است'),
    username: z
      .string()
      .max(50, 'نام کاربری نباید بیشتر از ۵۰ کاراکتر باشد')
      .optional()
      .refine((v) => v === undefined || v.trim() === '' || v.trim().length >= 3, {
        message: 'نام کاربری باید حداقل ۳ کاراکتر باشد',
      }),
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

type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;

interface RegisterUserModalProps {
  open: boolean;
  onClose: () => void;
  /** بعد از 201 موفق صدا زده می‌شود تا والد لیست‌ها را refetch و Toast نشان دهد */
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export default function RegisterUserModal({ open, onClose, onSuccess, onError }: RegisterUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [cities, setCities] = useState<CityDto[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceDto | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityDto | null>(null);

  // نوع‌های کاربری از GET /api/v1/UserTypes خوانده می‌شود (بدون هاردکد)؛
  // تا زمان دیپلوی endpoint از لیست جایگزین استفاده می‌شود.
  const [userTypeOptions, setUserTypeOptions] = useState<UserTypeOption[]>(() =>
    toUserTypeOptions(FALLBACK_USER_TYPES)
  );
  const [loadingUserTypes, setLoadingUserTypes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    resetField,
  } = useForm<AdminRegisterFormData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      livingProvince: '',
      livingCity: '',
      livingAddress: '',
      userTypeId: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await getProvinces();
        if (res.success && res.data) setProvinces(res.data);
      } catch {
        // ignore
      } finally {
        setLoadingProvinces(false);
      }
    };
    const fetchUserTypes = async () => {
      setLoadingUserTypes(true);
      try {
        const res = await getUserTypes();
        const live: UserTypeDto[] | undefined = res.success ? res.data ?? undefined : undefined;
        // فقط در صورت پاسخ معتبر، جایگزین لیست جایگزین می‌شود
        if (live && live.length > 0) setUserTypeOptions(toUserTypeOptions(live));
      } catch {
        // ignore — لیست جایگزین باقی می‌ماند
      } finally {
        setLoadingUserTypes(false);
      }
    };
    fetchProvinces();
    fetchUserTypes();
  }, [open ]);

  useEffect(() => {
    if (!selectedProvince) return;
    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity(null);
      resetField('livingCity');
      try {
        const res = await getCitiesByProvince(selectedProvince.id);
        if (res.success && res.data) setCities(res.data);
      } catch {
        // ignore
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvince, resetField]);

  const handleClose = () => {
    if (submitting) return;
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: AdminRegisterFormData) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const body: AdminRegisterDto = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        livingProvince: data.livingProvince,
        livingCity: data.livingCity,
        userTypeId: data.userTypeId,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };
      if (data.username) body.username = data.username.trim();
      if (data.livingAddress?.trim()) body.livingAddress = data.livingAddress.trim();

      const response = await registerAdminUser(body);
      if (response.success) {
        reset();
        setSelectedProvince(null);
        setSelectedCity(null);
        setCities([]);
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      // خطاهای 400 بک‌اند از errors[0] خوانده و به فارسی ترجمه می‌شوند
      const message = extractApiErrorMessage(err, 'خطا در ثبت کاربر');
      setServerError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const helper = (message?: string) => message ?? ' ';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" />
        ثبت کاربر جدید (بدون نیاز به OTP)
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers sx={{ p: 3 }}>
          {serverError && (
            <Alert severity="error" onClose={() => setServerError(null)} sx={{ borderRadius: 2, mb: 2 }}>
              {serverError}
            </Alert>
          )}
          <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
            کاربر با وضعیت غیرفعال ساخته می‌شود و تا زمان تایید در صفحه «در انتظار تایید»، امکان ورود ندارد.
          </Alert>

          <Grid container spacing={1} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام *"
                error={!!errors.firstName}
                helperText={helper(errors.firstName?.message)}
                disabled={submitting}
                sx={gridFieldSx}
                {...register('firstName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام خانوادگی *"
                error={!!errors.lastName}
                helperText={helper(errors.lastName?.message)}
                disabled={submitting}
                sx={gridFieldSx}
                {...register('lastName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="شماره موبایل *"
                placeholder="09123456789"
                error={!!errors.phoneNumber}
                helperText={helper(errors.phoneNumber?.message)}
                disabled={submitting}
                dir="ltr"
                slotProps={{ htmlInput: { dir: 'ltr', style: { textAlign: 'left' } } }}
                sx={gridFieldSx}
                {...register('phoneNumber')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام کاربری (اختیاری، باید یکتا باشد)"
                error={!!errors.username}
                helperText={helper(errors.username?.message)}
                disabled={submitting}
                autoComplete="off"
                sx={gridFieldSx}
                {...register('username')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordInput
                compact
                label="رمز عبور *"
                name="password"
                register={register('password')}
                error={errors.password}
                disabled={submitting}
                autoComplete="new-password"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <PasswordInput
                compact
                label="تکرار رمز عبور *"
                name="confirmPassword"
                register={register('confirmPassword')}
                error={errors.confirmPassword}
                disabled={submitting}
                autoComplete="new-password"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={provinces}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingProvinces}
                disabled={submitting}
                value={selectedProvince}
                onChange={(_, newValue) => {
                  setSelectedProvince(newValue);
                  setCities([]);
                  setSelectedCity(null);
                  resetField('livingCity');
                  setValue('livingProvince', newValue?.name || '', { shouldValidate: true });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="استان محل سکونت *"
                    error={!!errors.livingProvince}
                    helperText={helper(errors.livingProvince?.message)}
                  />
                )}
                sx={gridFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={cities}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingCities}
                disabled={submitting || !selectedProvince}
                value={selectedCity}
                onChange={(_, newValue) => {
                  setSelectedCity(newValue);
                  setValue('livingCity', newValue?.name || '', { shouldValidate: true });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="شهر محل سکونت *"
                    error={!!errors.livingCity}
                    helperText={helper(errors.livingCity?.message)}
                  />
                )}
                sx={gridFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="آدرس محل سکونت (اختیاری)"
                error={!!errors.livingAddress}
                helperText={helper(errors.livingAddress?.message)}
                disabled={submitting}
                sx={gridFieldSx}
                {...register('livingAddress')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="نوع کاربر *"
                defaultValue=""
                error={!!errors.userTypeId}
                helperText={helper(errors.userTypeId?.message)}
                disabled={submitting || loadingUserTypes}
                sx={gridFieldSx}
                {...register('userTypeId')}
              >
                {userTypeOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={submitting}>
            انصراف
          </Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ borderRadius: 2, px: 4 }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'ثبت کاربر'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
