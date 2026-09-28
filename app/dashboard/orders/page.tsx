'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  TextField,
  alpha,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as SuccessIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

const mockOrders = [
  { id: 1001, customer: 'علی رضایی', product: 'لپ‌تاپ ایسوس', amount: '۳۵,۰۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۵', status: 'تکمیل شده' },
  { id: 1002, customer: 'مریم احمدی', product: 'موبایل سامسونگ', amount: '۲۸,۰۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۶', status: 'در انتظار' },
  { id: 1003, customer: 'حسن محمدی', product: 'تبلت اپل', amount: '۴۲,۰۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۶', status: 'ارسال شده' },
  { id: 1004, customer: 'سارا کریمی', product: 'هدفون سونی', amount: '۳,۵۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۷', status: 'تکمیل شده' },
  { id: 1005, customer: 'امیر حسینی', product: 'مانیتور Dell', amount: '۱۵,۰۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۷', status: 'لغو شده' },
  { id: 1006, customer: 'نیلوفر عباسی', product: 'لپ‌تاپ ایسوس', amount: '۳۵,۰۰۰,۰۰۰ تومان', date: '۱۴۰۳/۰۴/۱۸', status: 'تکمیل شده' },
];

export default function OrdersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = order.customer.includes(searchQuery) || order.product.includes(searchQuery) || order.id.toString().includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'تکمیل شده': return { color: '#4caf50', bg: alpha('#4caf50', 0.1), icon: <SuccessIcon fontSize="small" /> };
      case 'در انتظار': return { color: '#ff9800', bg: alpha('#ff9800', 0.1), icon: <PendingIcon fontSize="small" /> };
      case 'ارسال شده': return { color: '#2196f3', bg: alpha('#2196f3', 0.1), icon: <ShippingIcon fontSize="small" /> };
      case 'لغو شده': return { color: '#f44336', bg: alpha('#f44336', 0.1), icon: <CancelIcon fontSize="small" /> };
      default: return { color: '#9e9e9e', bg: alpha('#9e9e9e', 0.1), icon: <ReceiptIcon fontSize="small" /> };
    }
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <OrderIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>مدیریت سفارشات</Typography>
            <Typography variant="caption" color="text.secondary">{mockOrders.length} سفارش ثبت شده (آزمایشی)</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          placeholder="جستجوی سفارش، مشتری یا محصول..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>,
            }
          }}
          sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) } }}
        />

        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {['all', 'تکمیل شده', 'در انتظار', 'ارسال شده', 'لغو شده'].map((status) => (
            <Chip
              key={status}
              label={status === 'all' ? 'همه' : status}
              onClick={() => setFilterStatus(status)}
              sx={{
                borderRadius: 2, fontWeight: filterStatus === status ? 700 : 500,
                bgcolor: filterStatus === status ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: filterStatus === status ? 'primary.main' : 'text.secondary',
                border: '1px solid', borderColor: filterStatus === status ? 'primary.main' : 'divider',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── Orders Grid ── */}
      {filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <OrderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">سفارشی یافت نشد</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <Grid key={order.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
                    border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.4), boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`, transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05), px: 1, py: 0.5, borderRadius: 1.5 }}>
                      #{order.id}
                    </Typography>
                    <Chip
                      icon={statusConfig.icon}
                      label={order.status}
                      size="small"
                      sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700, '& .MuiChip-icon': { color: statusConfig.color } }}
                    />
                  </Box>
                  
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '1rem', fontWeight: 'bold' }}>
                        {order.customer.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{order.customer}</Typography>
                        <Typography variant="caption" color="text.secondary">{order.date}</Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {order.product}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
                      {order.amount}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
                    <Tooltip title="مشاهده جزئیات">
                      <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
