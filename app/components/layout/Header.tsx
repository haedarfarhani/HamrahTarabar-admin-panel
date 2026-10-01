'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Box,
  Tooltip,
  Divider,
  Popover,
  Stack,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  LocalShipping as CargoIcon,
  Handshake as RequestIcon,
  SupportAgent as SupportIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/app/lib/auth-store';
import { AdminNotificationItem, getAdminNotifications } from '@/app/lib/api';

const KIND_META: Record<string, { color: string; icon: React.ReactNode }> = {
  cargo: { color: '#f57c00', icon: <CargoIcon fontSize="small" /> },
  request: { color: '#1565c0', icon: <RequestIcon fontSize="small" /> },
  support: { color: '#6a1b9a', icon: <SupportIcon fontSize="small" /> },
  review: { color: '#00897b', icon: <ReviewIcon fontSize="small" /> },
};

const n = (value: number) => value.toLocaleString('fa-IR');

const when = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return `${n(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${n(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${n(days)} روز پیش`;
};

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [badge, setBadge] = useState(0);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await getAdminNotifications();
        if (!alive || !response.success || !response.data) return;
        setBadge(response.data.badge ?? 0);
        setItems(response.data.items ?? []);
      } catch {
        if (alive) {
          setBadge(0);
          setItems([]);
        }
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

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

  const openItem = (item: AdminNotificationItem) => {
    setNotifAnchor(null);
    router.push(item.href);
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

        <Tooltip title="اعلان‌ها">
          <IconButton onClick={(event) => setNotifAnchor(event.currentTarget)}>
            <Badge badgeContent={badge > 99 ? '۹۹+' : badge || undefined} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="حساب کاربری">
          <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
            <Avatar alt={user?.fullName || 'کاربر'} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
              {user?.fullName?.[0] || <PersonIcon />}
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

        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 24px)', borderRadius: 3, mt: 1 } } }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>اعلان‌ها</Typography>
              <Typography variant="caption" color="text.secondary">
                {badge > 0 ? `${n(badge)} مورد برای پیگیری` : 'صف خالی است'}
              </Typography>
            </Box>
            <Chip size="small" label={badge > 0 ? n(badge) : '۰'} color={badge > 0 ? 'error' : 'default'} />
          </Stack>
          <Divider />
          <Box sx={{ maxHeight: 420, overflow: 'auto', p: 1 }}>
            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                بار، پیشنهاد، پشتیبانی یا نظری برای پیگیری نیست.
              </Typography>
            )}
            {items.map((item) => {
              const meta = KIND_META[item.kind] ?? KIND_META.cargo;
              return (
                <Box
                  key={`${item.kind}-${item.id}`}
                  onClick={() => openItem(item)}
                  sx={{
                    display: 'flex',
                    gap: 1.25,
                    p: 1.25,
                    mb: 0.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: meta.color,
                      bgcolor: alpha(meta.color, 0.12),
                    }}
                  >
                    {meta.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{when(item.at)}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {item.body}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Popover>
      </Toolbar>
    </AppBar>
  );
}
