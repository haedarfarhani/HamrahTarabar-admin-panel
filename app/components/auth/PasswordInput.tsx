'use client';

import { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface PasswordInputProps {
  label?: string;
  name: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
  autoComplete?: string;
}

export default function PasswordInput({
  label = 'رمز عبور',
  name,
  register,
  error,
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      fullWidth
      label={label}
      type={showPassword ? 'text' : 'password'}
      error={!!error}
      helperText={error?.message}
      disabled={disabled}
      autoComplete={autoComplete}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
            borderWidth: '1px',
            borderStyle: 'solid',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.87)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : '#1976d2',
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
            color: error ? '#d32f2f' : '#1976d2',
          },
        },
      }}
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
      {...register}
    />
  );
}
