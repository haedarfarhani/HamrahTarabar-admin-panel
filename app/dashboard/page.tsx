'use client';

import { Box, Grid, Typography, Card, CardContent, alpha, useTheme, Avatar } from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  AttachMoney as RevenueIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as SuccessIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';

const stats = [
  {
    title: 'کل کاربران',
    value: '۱,۲۳۴',
    icon: <PeopleIcon fontSize="large" />,
    gradient: ['#1976d2', '#1565c0'],
    shadowColor: '#1976d2',
    change: '+۱۲٪',
    changeLabel: 'نسبت به ماه قبل',
    changeType: 'up' as const,
  },
  {
    title: 'سفارشات',
    value: '۵۶۷',
    icon: <OrdersIcon fontSize="large" />,
    gradient: ['#9c27b0', '#7b1fa2'],
    shadowColor: '#9c27b0',
    change: '+۸٪',
    changeLabel: 'نسبت به ماه قبل',
    changeType: 'up' as const,
  },
  {
    title: 'محصولات',
    value: '۸۹',
    icon: <ProductsIcon fontSize="large" />,
    gradient: ['#f57c00', '#ef6c00'],
    shadowColor: '#f57c00',
    change: '+۳',
    changeLabel: 'محصول جدید',
    changeType: 'up' as const,
  },
  {
    title: 'درآمد کل',
    value: '۴۵ م',
    icon: <RevenueIcon fontSize="large" />,
    gradient: ['#4caf50', '#388e3c'],
    shadowColor: '#4caf50',
    change: '-۲٪',
    changeLabel: 'نسبت به ماه قبل',
    changeType: 'down' as const,
  },
];

const recentOrders = [
  { id: 1, customer: 'علی رضایی', product: 'لپ‌تاپ ایسوس', amount: '۳۵,۰۰۰,۰۰۰ تومان', status: 'تکمیل شده', time: '۱۰ دقیقه پیش' },
  { id: 2, customer: 'مریم احمدی', product: 'موبایل سامسونگ', amount: '۲۸,۰۰۰,۰۰۰ تومان', status: 'در انتظار', time: '۱ ساعت پیش' },
  { id: 3, customer: 'حسن محمدی', product: 'تبلت اپل', amount: '۴۲,۰۰۰,۰۰۰ تومان', status: 'ارسال شده', time: '۳ ساعت پیش' },
  { id: 4, customer: 'سارا کریمی', product: 'هدفون سونی', amount: '۳,۵۰۰,۰۰۰ تومان', status: 'تکمیل شده', time: 'دیروز' },
];

export default function DashboardPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'تکمیل شده': return { color: '#4caf50', bg: alpha('#4caf50', 0.1), icon: <SuccessIcon fontSize="small" /> };
      case 'در انتظار': return { color: '#ff9800', bg: alpha('#ff9800', 0.1), icon: <PendingIcon fontSize="small" /> };
      case 'ارسال شده': return { color: '#2196f3', bg: alpha('#2196f3', 0.1), icon: <ShippingIcon fontSize="small" /> };
      default: return { color: '#9e9e9e', bg: alpha('#9e9e9e', 0.1), icon: <OrdersIcon fontSize="small" /> };
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#fff' : '#000' }}>
          سلام، خوش آمدید 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          این خلاصه‌ای از وضعیت سیستم در امروز است.
        </Typography>
      </Box>

      {/* ── Stats Grid ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4, position: 'relative', overflow: 'hidden', color: '#fff',
                background: `linear-gradient(135deg, ${stat.gradient[0]}, ${stat.gradient[1]})`,
                boxShadow: `0 10px 30px ${alpha(stat.shadowColor, 0.4)}`,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 14px 40px ${alpha(stat.shadowColor, 0.6)}` },
              }}
            >
              {/* Decorative Circle */}
              <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))' }} />
              
              <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500, mb: 0.5 }}>{stat.title}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>{stat.value}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                    {stat.icon}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: stat.changeType === 'up' ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)', px: 1, py: 0.5, borderRadius: 2 }}>
                    {stat.changeType === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    <Typography variant="body2" sx={{ fontWeight: 700, dir: 'ltr' }}>{stat.change}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{stat.changeLabel}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* ── Recent Orders ── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08), height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>سفارشات اخیر</Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                مشاهده همه
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {recentOrders.map((order, idx) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <Box key={order.id} sx={{ p: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < recentOrders.length - 1 ? '1px solid' : 'none', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold' }}>{order.customer.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{order.customer}</Typography>
                        <Typography variant="caption" color="text.secondary">{order.product} • {order.time}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{order.amount}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: statusConfig.color, bgcolor: statusConfig.bg, px: 1, py: 0.25, borderRadius: 1.5 }}>
                        {statusConfig.icon}
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{order.status}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* ── System Status / Overview (Placeholder) ── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08), height: '100%', background: `linear-gradient(to bottom, ${isDark ? '#1e1e1e' : '#fff'}, ${isDark ? '#121212' : '#f5f5f5'})` }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>وضعیت سیستم</Typography>
            </Box>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { label: 'فضای ذخیره‌سازی', value: 75, color: '#f57c00' },
                { label: 'بار پردازنده', value: 30, color: '#4caf50' },
                { label: 'مصرف حافظه', value: 60, color: '#2196f3' },
              ].map((item) => (
                <Box key={item.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.value}٪</Typography>
                  </Box>
                  <Box sx={{ w: '100%', height: 8, bgcolor: alpha(item.color, 0.2), borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${item.value}%`, height: '100%', bgcolor: item.color, borderRadius: 4, transition: 'width 1s ease-in-out' }} />
                  </Box>
                </Box>
              ))}
              
              <Box sx={{ mt: 'auto', pt: 2, p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SuccessIcon color="success" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>همه سیستم‌ها نرمال</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>آخرین بررسی: ۲ دقیقه پیش</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
