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
import { getProvinces, getCitiesByProvince } from '@/app/lib/api';
import { ProvinceDto, CityDto } from '@/app/types/api';
import PasswordInput from './PasswordInput';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'نام الزامی است'),
    lastName: z.string().min(1, 'نام خانوادگی الزامی است'),
    phoneNumber: z
      .string()
      .min(1, 'شماره موبایل الزامی است')
      .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است (مثال: 09123456789)'),
    livingProvince: z.string().min(1, 'استان محل سکونت الزامی است'),
    livingCity: z.string().min(1, 'شهر محل سکونت الزامی است'),
    userTypeId: z.string().min(1, 'نوع کاربری الزامی است'),
    username: z.string().min(1, 'نام کاربری الزامی است'),
    password: z
      .string()
      .min(1, 'رمز عبور الزامی است')
      .regex(
        PASSWORD_REGEX,
        'رمز عبور باید حداقل ۸ کاراکتر باشد و شامل حروف بزرگ، حروف کوچک، عدد و کاراکتر خاص (@$!%*?&) باشد'
      ),
    confirmPassword: z.string().min(1, 'تکرار رمز عبور الزامی است'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const fieldSx = {
  mb: 2.5,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'white',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.87)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1976d2',
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    color: 'rgba(0, 0, 0, 0.87)',
    padding: '14px 16px',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0, 0, 0, 0.6)',
    '&.Mui-focused': {
      color: '#1976d2',
    },
  },
};

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    resetField,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchProvince = watch('livingProvince');

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
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!watchProvince) {
      setCities([]);
      setSelectedCity(null);
      resetField('livingCity');
      return;
    }
    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity(null);
      resetField('livingCity');
      try {
        const res = await getCitiesByProvince(watchProvince);
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
  }, [watchProvince, resetField]);

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl">
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ borderRadius: 2, mb: 3 }}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2, mb: 3 }}>
          ثبت‌نام موفقیت‌آمیز بود
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '20px' }}>
        <TextField
          fullWidth
          label="نام"
          error={!!errors.firstName}
          helperText={errors.firstName?.message}
          disabled={isLoading}
          sx={fieldSx}
          {...register('firstName')}
        />
        <TextField
          fullWidth
          label="نام خانوادگی"
          error={!!errors.lastName}
          helperText={errors.lastName?.message}
          disabled={isLoading}
          sx={fieldSx}
          {...register('lastName')}
        />
      </div>

      <TextField
        fullWidth
        label="شماره موبایل"
        placeholder="09123456789"
        error={!!errors.phoneNumber}
        helperText={errors.phoneNumber?.message}
        disabled={isLoading}
        dir="ltr"
        sx={fieldSx}
        {...register('phoneNumber')}
      />

      <TextField
        fullWidth
        label="نام کاربری"
        error={!!errors.username}
        helperText={errors.username?.message}
        disabled={isLoading}
        autoComplete="username"
        sx={fieldSx}
        {...register('username')}
      />

      <PasswordInput
        label="رمز عبور"
        name="password"
        register={register('password')}
        error={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
      />

      <PasswordInput
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
          setValue('livingProvince', newValue?.id || '', { shouldValidate: true });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="استان محل سکونت"
            error={!!errors.livingProvince}
            helperText={errors.livingProvince?.message}
            sx={fieldSx}
          />
        )}
        sx={fieldSx}
      />

      <Autocomplete
        options={cities}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={loadingCities}
        disabled={isLoading || !watchProvince}
        value={selectedCity}
        onChange={(_, newValue) => {
          setSelectedCity(newValue);
          setValue('livingCity', newValue?.id || '', { shouldValidate: true });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="شهر محل سکونت"
            error={!!errors.livingCity}
            helperText={errors.livingCity?.message}
            sx={fieldSx}
          />
        )}
        sx={fieldSx}
      />

      <TextField
        fullWidth
        select
        label="نوع کاربری"
        error={!!errors.userTypeId}
        helperText={errors.userTypeId?.message}
        disabled={isLoading}
        sx={fieldSx}
        {...register('userTypeId')}
      >
        <MenuItem value="driver">راننده</MenuItem>
        <MenuItem value="shipper">صاحب بار</MenuItem>
      </TextField>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <UserPlus size={20} />}
        sx={{
          borderRadius: 2,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(25, 118, 210, 0.5)',
          },
        }}
      >
        {isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
      </Button>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link
            href="/auth/login"
            style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
          >
            وارد شوید
          </Link>
        </span>
      </div>
    </form>
  );
}
