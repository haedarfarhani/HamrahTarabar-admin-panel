'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  LocalShipping as CargoIcon,
  StarRate as CommentIcon,
  TaskAlt as ApprovalIcon,
  Security as RolesIcon,
  VpnKey as PermissionsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  ChevronLeft,
  ChevronRight,
  Storefront as StoreIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';
import { getSupportQueueCount } from '@/app/lib/api';

const DRAWER_WIDTH = 260;

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'داشبورد', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'کاربران', href: '/dashboard/regular-users', icon: <PeopleIcon /> },
  { label: 'کاربران ادمین', href: '/dashboard/users', icon: <AdminIcon /> },
  { label: 'نقش‌ها', href: '/dashboard/roles', icon: <RolesIcon /> },
  { label: 'دسترسی‌ها', href: '/dashboard/permissions', icon: <PermissionsIcon /> },
  { label: 'بارها', href: '/dashboard/cargos', icon: <CargoIcon /> },
  { label: 'منتظر تأیید', href: '/dashboard/cargo-approval', icon: <ApprovalIcon /> },
  { label: 'نظرات', href: '/dashboard/reviews', icon: <CommentIcon /> },
  { label: 'پشتیبانی', href: '/dashboard/support', icon: <SupportIcon /> },
  { label: 'پروفایل', href: '/dashboard/profile', icon: <ProfileIcon /> },
  { label: 'تنظیمات', href: '/dashboard/settings', icon: <SettingsIcon /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [openSupport, setOpenSupport] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      getSupportQueueCount()
        .then((response) => {
          if (active && response.success) setOpenSupport(response.data?.count ?? 0);
        })
        .catch(() => {
          if (active) setOpenSupport(0);
        });
    };
    load();
    const timer = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5 }}>
          <StoreIcon />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="primary">
          حمراهatraabar
        </Typography>
      </Toolbar>

      <List sx={{ flex: 1, px: 1.5, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
                {item.href === '/dashboard/support' && openSupport > 0 && (
                  <Chip
                    size="small"
                    label={openSupport.toLocaleString('fa-IR')}
                    sx={{ bgcolor: '#e65100', color: '#fff', height: 22 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          نسخه ۱.۰.۰
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
}
