'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    twoFactor: false,
    siteName: 'پنل مدیریت حمراهatraabar',
    siteUrl: 'https://admin.hamrahtarabar.com',
    supportEmail: 'support@hamrahtarabar.com',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        تنظیمات
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                تنظیمات عمومی
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="نام سایت"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="آدرس سایت"
                  value={settings.siteUrl}
                  onChange={(e) => handleChange('siteUrl', e.target.value)}
                  fullWidth
                  variant="outlined"
                  dir="ltr"
                />
                <TextField
                  label="ایمیل پشتیبانی"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  fullWidth
                  variant="outlined"
                  dir="ltr"
                />
                <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>
                  ذخیره تغییرات
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                تنظیمات اعلان‌ها
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={() => handleToggle('notifications')}
                    />
                  }
                  label="اعلان‌های ایمیلی"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={() => handleToggle('darkMode')}
                    />
                  }
                  label="حالت تیره پیش‌فرض"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactor}
                      onChange={() => handleToggle('twoFactor')}
                    />
                  }
                  label="احراز هویت دو مرحله‌ای"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
