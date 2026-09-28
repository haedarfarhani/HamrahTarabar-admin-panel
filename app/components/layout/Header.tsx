'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/app/lib/auth-store';

const DRAWER_WIDTH = 260;

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    router.push('/auth/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' }, mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 2,
            py: 0.5,
            flex: { xs: 1, sm: 'auto' },
            maxWidth: 400,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', ml: 1 }} />
          <InputBase
            placeholder="جستجو..."
            sx={{ flex: 1, fontFamily: 'inherit' }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={mode === 'light' ? 'حالت تیره' : 'حالت روشن'}>
          <IconButton onClick={toggleTheme} sx={{ ml: 1 }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="اعلان‌ها">
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="حساب کاربری">
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
            <Avatar
              alt={user?.fullName || 'کاربر'}
              sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
            >
              {user?.fullName?.[0] || <PersonIcon />}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Typography variant="subtitle2">
              {user?.fullName || 'کاربر'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.userName || ''}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProfileMenuClose}>
            <PersonIcon sx={{ ml: 1 }} fontSize="small" />
            پروفایل
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ ml: 1 }} fontSize="small" />
            خروج
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, minWidth: 280 }}>
            <Typography variant="subtitle2">اعلان‌ها</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Typography variant="body2">سفارش جدید ثبت شد</Typography>
          </MenuItem>
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Typography variant="body2">کاربر جدید عضو شد</Typography>
          </MenuItem>
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Typography variant="body2">موجودی محصول کم شد</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
