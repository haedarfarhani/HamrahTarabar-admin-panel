'use client';

import { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { fieldSx, gridFieldSx } from './fieldStyles';

interface PasswordInputProps {
  label?: string;
  name: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
  autoComplete?: string;
  /** استایل بدون حاشیه پایین — برای استفاده در grid دو ستونه */
  compact?: boolean;
}

export default function PasswordInput({
  label = 'رمز عبور',
  register: registerProp,
  error,
  disabled = false,
  autoComplete = 'current-password',
  compact = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      fullWidth
      label={label}
      type={showPassword ? 'text' : 'password'}
      error={!!error}
      /* فضای متن کمکی همیشه رزرو می‌شود تا چیدمان جا به جا نشود */
      helperText={error?.message ?? ' '}
      disabled={disabled}
      autoComplete={autoComplete}
      sx={compact ? gridFieldSx : fieldSx}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                size="small"
                disabled={disabled}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...registerProp}
    />
  );
}
