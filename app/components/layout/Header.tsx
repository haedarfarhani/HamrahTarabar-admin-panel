'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Box,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import { BrandPlaceholder } from '@/app/components/brand/BrandLogo';
import {
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/app/lib/auth-store';
import NotificationCenter from '@/app/components/notifications/NotificationCenter';
import { useNotificationPolling } from '@/app/lib/notification-store';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [query, setQuery] = useState('');

  // وضعیت اعلان‌ها یک‌بار در کل پنل polling می‌شود
  useNotificationPolling();

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    router.push('/auth/login');
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/cargos?q=${encodeURIComponent(q)}` : '/dashboard/cargos');
  };

  const today = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box
          component="form"
          onSubmit={submitSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2.5,
            px: 1.5,
            py: 0.4,
            flex: { xs: 1, md: '0 1 420px' },
            border: '1px solid',
            borderColor: 'transparent',
            '&:focus-within': { borderColor: 'primary.main', bgcolor: 'background.paper' },
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', ml: 1 }} fontSize="small" />
          <InputBase
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی شماره بار، شهر یا نام"
            sx={{ flex: 1, fontFamily: 'inherit', fontSize: 14 }}
          />
        </Box>

        <Chip
          label={today}
          size="small"
          variant="outlined"
          sx={{ display: { xs: 'none', lg: 'inline-flex' }, fontWeight: 700 }}
        />

        <Box sx={{ flex: 1 }} />

        <Tooltip title={mode === 'light' ? 'حالت تیره' : 'حالت روشن'}>
          <IconButton onClick={toggleTheme}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <NotificationCenter />

        <Tooltip title="حساب کاربری">
          <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
            <Avatar
              alt={user?.fullName || 'کاربر'}
              sx={{
                width: 36,
                height: 36,
                bgcolor: user?.fullName ? 'primary.main' : 'grey.200',
                fontSize: 16,
              }}
            >
              {user?.fullName?.[0] || <BrandPlaceholder size={22} />}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Typography variant="subtitle2">{user?.fullName || 'کاربر'}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.userName || ''}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); router.push('/dashboard/profile'); }}>
            <PersonIcon sx={{ ml: 1 }} fontSize="small" />
            پروفایل
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ ml: 1 }} fontSize="small" />
            خروج
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
