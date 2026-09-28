'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Alert, CircularProgress, Step, StepLabel, Stepper } from '@mui/material';
import { Phone, KeyRound, CheckCircle } from 'lucide-react';
import { forgotPassword, resetPassword } from '@/app/lib/api';
import PasswordInput from './PasswordInput';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'شماره موبایل الزامی است')
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است (مثال: 09123456789)'),
});

const resetSchema = z
  .object({
    otpCode: z
      .string()
      .min(1, 'کد تأیید الزامی است')
      .length(6, 'کد تأیید باید ۶ رقمی باشد'),
    newPassword: z
      .string()
      .min(1, 'رمز عبور جدید الزامی است')
      .regex(
        PASSWORD_REGEX,
        'رمز عبور باید حداقل ۸ کاراکتر باشد و شامل حروف بزرگ، حروف کوچک، عدد و کاراکتر خاص (@$!%*?&) باشد'
      ),
    confirmPassword: z.string().min(1, 'تکرار رمز عبور الزامی است'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  });

type PhoneFormData = z.infer<typeof phoneSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

const steps = ['شماره موبایل', 'کد تأیید و رمز جدید'];

const fieldSx = {
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

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onPhoneSubmit = async (data: PhoneFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await forgotPassword(data.phoneNumber);
      if (res.success) {
        setPhoneNumber(data.phoneNumber);
        setActiveStep(1);
        setSuccessMessage('کد تأیید به شماره موبایل شما ارسال شد');
      } else {
        setError(res.message || 'خطا در ارسال کد تأیید');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در اتصال به سرور');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await resetPassword({
        phoneNumber,
        otpCode: data.otpCode,
        newPassword: data.newPassword,
      });
      if (res.success) {
        router.push('/auth/login?reset=success');
      } else {
        setError(res.message || 'خطا در بازیابی رمز عبور');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در اتصال به سرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ direction: 'ltr', mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && activeStep === 1 && (
        <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {activeStep === 0 && (
        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
            <Phone size={18} />
            <span>شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود</span>
          </div>

          <TextField
            fullWidth
            label="شماره موبایل"
            placeholder="09123456789"
            error={!!phoneForm.formState.errors.phoneNumber}
            helperText={phoneForm.formState.errors.phoneNumber?.message}
            disabled={isLoading}
            dir="ltr"
            sx={{ ...fieldSx, mb: 3 }}
            {...phoneForm.register('phoneNumber')}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Phone size={20} />}
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
            {isLoading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
          </Button>
        </form>
      )}

      {activeStep === 1 && (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
            <KeyRound size={18} />
            <span>کد تأیید دریافتی و رمز عبور جدید را وارد کنید</span>
          </div>

          <TextField
            fullWidth
            label="کد تأیید (OTP)"
            placeholder="123456"
            error={!!resetForm.formState.errors.otpCode}
            helperText={resetForm.formState.errors.otpCode?.message}
            disabled={isLoading}
            dir="ltr"
            slotProps={{ htmlInput: { maxLength: 6 } }}
            sx={{ ...fieldSx, mb: 2 }}
            {...resetForm.register('otpCode')}
          />

          <div style={{ marginBottom: '16px' }}>
            <PasswordInput
              label="رمز عبور جدید"
              name="newPassword"
              register={resetForm.register('newPassword')}
              error={resetForm.formState.errors.newPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <PasswordInput
              label="تکرار رمز عبور جدید"
              name="confirmPassword"
              register={resetForm.register('confirmPassword')}
              error={resetForm.formState.errors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => {
                setActiveStep(0);
                setError(null);
                setSuccessMessage(null);
              }}
              sx={{
                borderRadius: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              بازگشت
            </Button>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckCircle size={20} />
                )
              }
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
              {isLoading ? 'در حال بازیابی...' : 'بازیابی رمز عبور'}
            </Button>
          </div>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link
          href="/auth/login"
          style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
        >
          بازگشت به صفحه ورود
        </Link>
      </div>
    </div>
  );
}
