'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import { Person as PersonIcon, Lock as LockIcon } from '@mui/icons-material';
import { getCurrentUser, updateProfile, changePassword } from '@/app/lib/api';
import { UserResponseDto, UpdateProfileDto, ChangePasswordDto } from '@/app/types/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    livingProvince: '',
    livingCity: '',
    livingAddress: '',
    vehicleType: '',
    vehicleSubType: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        setProfileForm({
          firstName: response.data.fullName?.split(' ')[0] || '',
          lastName: response.data.fullName?.split(' ').slice(1).join(' ') || '',
          phoneNumber: response.data.phoneNumber || '',
          livingProvince: response.data.livingProvince || '',
          livingCity: response.data.livingCity || '',
          livingAddress: response.data.livingAddress || '',
          vehicleType: response.data.vehicleType || '',
          vehicleSubType: response.data.vehicleSubType || '',
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در دریافت اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateProfile(profileForm);
      if (response.success) {
        setSuccess('پروفایل با موفقیت به‌روزرسانی شد');
        fetchUser();
      } else {
        setError(response.message || 'خطا در به‌روزرسانی پروفایل');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در به‌روزرسانی پروفایل');
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'رمز عبور فعلی الزامی است';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'رمز عبور جدید الزامی است';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص باشد';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'رمز عبور جدید و تکرار آن مطابقت ندارند';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await changePassword(passwordForm);
      if (response.success) {
        setSuccess('رمز عبور با موفقیت تغییر کرد');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(response.message || 'خطا در تغییر رمز عبور');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در تغییر رمز عبور');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        پروفایل کاربری
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* User Info Card */}
      {user && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {user.fullName || user.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.phoneNumber}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  {user.roles?.map((role) => (
                    <Chip key={role} label={role} size="small" color="primary" variant="outlined" />
                  ))}
                  <Chip
                    label={user.isActive ? 'فعال' : 'غیرفعال'}
                    size="small"
                    color={user.isActive ? 'success' : 'default'}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => {
              setTabValue(newValue);
              setError(null);
              setSuccess(null);
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<PersonIcon />} label="اطلاعات پروفایل" iconPosition="start" />
            <Tab icon={<LockIcon />} label="تغییر رمز عبور" iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="نام"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="نام خانوادگی"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="شماره تلفن"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    fullWidth
                    dir="ltr"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="استان"
                    value={profileForm.livingProvince}
                    onChange={(e) => setProfileForm({ ...profileForm, livingProvince: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="شهر"
                    value={profileForm.livingCity}
                    onChange={(e) => setProfileForm({ ...profileForm, livingCity: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="نوع وسیله نقلیه"
                    value={profileForm.vehicleType}
                    onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="آدرس"
                    value={profileForm.livingAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, livingAddress: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={profileLoading}
                    sx={{ mt: 1 }}
                  >
                    {profileLoading ? <CircularProgress size={24} /> : 'ذخیره تغییرات'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handlePasswordSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
                <TextField
                  label="رمز عبور فعلی"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  fullWidth
                  required
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                />
                <TextField
                  label="رمز عبور جدید"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  fullWidth
                  required
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                />
                <TextField
                  label="تکرار رمز عبور جدید"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  fullWidth
                  required
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                />
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  رمز عبور باید حداقل ۸ کاراکتر شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص (@$!%*?&) باشد.
                </Typography>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordLoading}
                  sx={{ mt: 1, alignSelf: 'flex-start' }}
                >
                  {passwordLoading ? <CircularProgress size={24} /> : 'تغییر رمز عبور'}
                </Button>
              </Box>
            </form>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
