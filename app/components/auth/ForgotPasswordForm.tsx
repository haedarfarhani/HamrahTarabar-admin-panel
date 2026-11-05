'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Alert, CircularProgress, Step, StepLabel, Stepper } from '@mui/material';
import { Phone, KeyRound, CheckCircle, ArrowRight } from 'lucide-react';
import { forgotPassword, resetPassword } from '@/app/lib/api';
import PasswordInput from './PasswordInput';
import { fieldSx } from './fieldStyles';
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from '@/app/lib/password';
import { extractApiErrorMessage, translateBackendError } from '@/app/lib/admin-user-errors';

const identifierSchema = z.object({
  identifier: z
    .string()
    .min(1, 'شناسه الزامی است')
    .min(3, 'شناسه باید حداقل ۳ کاراکتر باشد')
    .max(100, 'شناسه حداکثر ۱۰۰ کاراکتر است'),
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
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
    confirmPassword: z.string().min(1, 'تکرار رمز عبور جدید الزامی است'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  });

type IdentifierFormData = z.infer<typeof identifierSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

const steps = ['شناسه کاربر', 'کد تأیید و رمز جدید'];

const primaryButtonSx = {
  borderRadius: 2,
  py: 1.5,
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
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onIdentifierSubmit = async (data: IdentifierFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await forgotPassword(data.identifier);
      if (res.success) {
        setIdentifier(data.identifier);
        setActiveStep(1);
        setSuccessMessage('کد تأیید برای شما ارسال شد');
      } else {
        setError(res.message ? translateBackendError(res.message) : 'خطا در ارسال کد تأیید');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(extractApiErrorMessage(error, 'خطا در اتصال به سرور'));
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await resetPassword({
        phoneNumber: identifier,
        otpCode: data.otpCode,
        newPassword: data.newPassword,
      });
      if (res.success) {
        router.push('/auth/login?reset=success');
      } else {
        setError(res.message ? translateBackendError(res.message) : 'خطا در بازیابی رمز عبور');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(extractApiErrorMessage(error, 'خطا در اتصال به سرور'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2, mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {successMessage && activeStep === 1 && (
        <Alert severity="success" sx={{ borderRadius: 2, mb: 2.5 }}>
          {successMessage}
        </Alert>
      )}

      {activeStep === 0 && (
        <form onSubmit={identifierForm.handleSubmit(onIdentifierSubmit)}>
          <p className="mb-5 flex items-center gap-2 text-sm text-slate-500">
            <Phone size={18} className="text-sky-600" />
            شناسه (نام کاربری) خود را وارد کنید تا کد تأیید برایتان ارسال شود
          </p>

          <TextField
            fullWidth
            label="شناسه (نام کاربری)"
            placeholder="heydar"
            error={!!identifierForm.formState.errors.identifier}
            helperText={identifierForm.formState.errors.identifier?.message}
            disabled={isLoading}
            dir="ltr"
            sx={fieldSx}
            {...identifierForm.register('identifier')}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Phone size={20} />}
            sx={primaryButtonSx}
          >
            {isLoading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
          </Button>
        </form>
      )}

      {activeStep === 1 && (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
          <p className="mb-5 flex items-center gap-2 text-sm text-slate-500">
            <KeyRound size={18} className="text-sky-600" />
            کد تأیید دریافتی و رمز عبور جدید را وارد کنید
          </p>

          <TextField
            fullWidth
            label="کد تأیید (OTP)"
            placeholder="123456"
            error={!!resetForm.formState.errors.otpCode}
            helperText={resetForm.formState.errors.otpCode?.message}
            disabled={isLoading}
            dir="ltr"
            slotProps={{ htmlInput: { maxLength: 6 } }}
            sx={fieldSx}
            {...resetForm.register('otpCode')}
          />

          <PasswordInput
            label="رمز عبور جدید"
            name="newPassword"
            register={resetForm.register('newPassword')}
            error={resetForm.formState.errors.newPassword}
            disabled={isLoading}
            autoComplete="new-password"
          />

          <PasswordInput
            label="تکرار رمز عبور جدید"
            name="confirmPassword"
            register={resetForm.register('confirmPassword')}
            error={resetForm.formState.errors.confirmPassword}
            disabled={isLoading}
            autoComplete="new-password"
          />

          <div className="mt-1 flex gap-3">
            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              startIcon={<ArrowRight size={20} />}
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
                color: '#1976d2',
                borderColor: '#93c5fd',
                '&:hover': { borderColor: '#1976d2', backgroundColor: '#eff6ff' },
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
                isLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle size={20} />
              }
              sx={primaryButtonSx}
            >
              {isLoading ? 'در حال بازیابی...' : 'بازیابی رمز عبور'}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          بازگشت به صفحه ورود
        </Link>
      </p>
    </div>
  );
}
