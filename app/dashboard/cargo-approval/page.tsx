'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Collapse,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  LocalShipping as CargoIcon,
  Schedule as PendingIcon,
  Close as CloseIcon,
  East as EastIcon,
  Route as RouteIcon,
  Scale as WeightIcon,
  DirectionsCar as VehicleIcon,
  CalendarMonth as DateIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getPendingCargos, getCargoById, approveCargo, rejectCargo } from '@/app/lib/api';
import { CargoApprovalResponseDto, CargoLoadDto } from '@/app/types/api';

/* ───────── Constants ───────── */

const statusLabels: Record<string, string> = {
  Unpublished: 'منتظر تأیید',
  Edited: 'ویرایش شده',
  Published: 'منتشر شده',
  Rejected: 'رد شده',
  Cancelled: 'لغو شده',
  InProgress: 'در حال حمل',
  Completed: 'تکمیل شده',
  Expired: 'منقضی شده',
};

const statusColors: Record<string, string> = {
  Unpublished: '#ff9800',
  Edited: '#2196f3',
  Published: '#4caf50',
  Rejected: '#f44336',
  Cancelled: '#9e9e9e',
  InProgress: '#1565c0',
  Completed: '#00c853',
  Expired: '#795548',
};

const NUMBER_STATUS: Record<number, string> = {
  4: 'Published',
  5: 'Rejected',
  6: 'Cancelled',
  7: 'Expired',
  8: 'Completed',
  9: 'InProgress',
  10: 'Edited',
  11: 'Unpublished',
};

const normalizeStatus = (value: unknown): string => {
  if (typeof value === 'number') {
    return NUMBER_STATUS[value] || 'Unpublished';
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (statusLabels[s]) return s;
    const asNumber = Number(s);
    if (!Number.isNaN(asNumber)) return normalizeStatus(asNumber);
  }
  return 'Unpublished';
};

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
};

const formatDateTime = (d?: string | null) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d;
  }
};

const formatPrice = (val?: number, currency?: string, displayText?: string) => {
  if (displayText) return displayText;
  if (!val) return 'توافقی';
  const unit = currency === 'Toman' ? 'تومان' : 'ریال';
  return `${val.toLocaleString('fa-IR')} ${unit}`;
};

/* ───────── Page ───────── */

export default function CargoApprovalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [pending, setPending] = useState<CargoApprovalResponseDto[]>([]);
  const [details, setDetails] = useState<Record<string, CargoLoadDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const inFlight = useRef<Set<string>>(new Set());
  const loadedIds = useRef<Set<string>>(new Set());

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadDetail = useCallback((id: string) => {
    if (inFlight.current.has(id) || loadedIds.current.has(id)) return;
    inFlight.current.add(id);
    setDetailLoading(true);
    setDetailError(null);
    getCargoById(id)
      .then((response) => {
        if (response.success && response.data) {
          loadedIds.current.add(id);
          setDetails((prev) => ({ ...prev, [id]: response.data! }));
        } else {
          setDetailError(response.message || 'جزئیات بار در دسترس نیست');
          setFailedIds((prev) => new Set(prev).add(id));
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string; errors?: string[] };
        setDetailError(e.errors?.[0] || e.message || 'خطا در دریافت جزئیات بار');
        setFailedIds((prev) => new Set(prev).add(id));
      })
      .finally(() => {
        inFlight.current.delete(id);
        setDetailLoading(false);
      });
  }, []);

  const fetchPending = useCallback(() => {
    getPendingCargos()
      .then((response) => {
        if (response.success && response.data) {
          const items = response.data;
          setPending(items);
          items.forEach((item) => loadDetail(item.cargoLoadID));
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string; errors?: string[] };
        setError(e.errors?.[0] || e.message || 'خطا در دریافت بارهای منتظر تأیید');
      })
      .finally(() => setLoading(false));
  }, [loadDetail]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const refresh = () => {
    setError(null);
    setLoading(true);
    fetchPending();
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    loadDetail(id);
  };

  const handleApprove = async (item: CargoApprovalResponseDto) => {
    setActionLoading(item.cargoLoadID);
    try {
      const response = await approveCargo(item.cargoLoadID);
      if (response.success) {
        setPending((prev) => prev.filter((p) => p.cargoLoadID !== item.cargoLoadID));
        setSnackbar({ open: true, message: 'بار منتشر شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: e.errors?.[0] || e.message || 'خطا در تأیید بار', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: CargoApprovalResponseDto) => {
    const reason = (rejectReasons[item.cargoLoadID] || '').trim();
    if (!reason) {
      setSnackbar({ open: true, message: 'دلیل رد بار الزامی است', severity: 'error' });
      return;
    }
    setActionLoading(item.cargoLoadID);
    try {
      const response = await rejectCargo(item.cargoLoadID, reason);
      if (response.success) {
        setPending((prev) => prev.filter((p) => p.cargoLoadID !== item.cargoLoadID));
        setRejectingId(null);
        setRejectReasons((prev) => {
          const next = { ...prev };
          delete next[item.cargoLoadID];
          return next;
        });
        setSnackbar({ open: true, message: 'بار رد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: e.errors?.[0] || e.message || 'خطا در رد بار', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const detailItem = detailId ? pending.find((p) => p.cargoLoadID === detailId) || null : null;
  const detailCargo = detailId ? details[detailId] || null : null;

  if (loading && pending.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PendingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            بارهای منتظر تأیید
          </Typography>
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={240} sx={{ borderRadius: 3, mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <PendingIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              بارهای منتظر تأیید
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pending.length.toLocaleString('fa-IR')} بار در انتظار بررسی (منتشر نشده + ویرایش شده)
            </Typography>
          </Box>
        </Box>
        <Tooltip title="بروزرسانی">
          <IconButton
            onClick={refresh}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── List ── */}
      {loading && pending.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={240} sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      ) : pending.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <ApproveIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">باری در انتظار تأیید نیست</Typography>
          <Typography variant="body2" color="text.disabled">همه بارها بررسی شده‌اند</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          {pending.map((item) => {
            const cargo = details[item.cargoLoadID] || null;
            const status = normalizeStatus(item.status);
            const statusColor = statusColors[status] || '#ff9800';
            const isRejecting = rejectingId === item.cargoLoadID;
            const busy = actionLoading === item.cargoLoadID;
            const loaded = Boolean(cargo);
            const failed = failedIds.has(item.cargoLoadID);

            return (
              <Card
                key={item.cargoLoadID}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: alpha(statusColor, 0.35),
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                  '&:hover': { borderColor: alpha(statusColor, 0.5), boxShadow: `0 8px 30px ${alpha(statusColor, 0.12)}`, transform: 'translateY(-2px)' },
                }}
              >
                {/* banner */}
                <Box sx={{ background: `linear-gradient(135deg, ${alpha(statusColor, isDark ? 0.2 : 0.08)}, ${alpha(statusColor, isDark ? 0.08 : 0.03)})`, borderBottom: '1px solid', borderColor: alpha(statusColor, 0.12), px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {loaded ? (
                      <>
                        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
                            {cargo!.originCity || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {cargo!.originProvince || ''}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5 }}>
                          <Box sx={{ width: 40, height: 2, bgcolor: alpha(statusColor, 0.4), borderRadius: 1 }} />
                          <EastIcon sx={{ color: statusColor, fontSize: 22 }} />
                        </Box>
                        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
                            {cargo!.destinationCity || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {cargo!.destinationProvince || ''}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>ثبت‌کننده</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
                            {item.ownerName || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>نوع بار</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
                            {item.cargoTypeName || '-'}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {cargo?.isUrgent && (
                      <Chip label="فوری" size="small" sx={{ bgcolor: alpha('#f44336', 0.12), color: '#f44336', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
                    )}
                    {item.referenceNumber && (
                      <Chip label={item.referenceNumber} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', height: 24 }} />
                    )}
                    <Chip
                      label={statusLabels[status] || status}
                      size="small"
                      sx={{ bgcolor: alpha(statusColor, 0.15), color: statusColor, fontWeight: 700, fontSize: '0.72rem', height: 26, border: `1px solid ${alpha(statusColor, 0.3)}` }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ p: 3, '&:last-child': { pb: 2 } }}>
                  {(item.statusNote || item.rejectionReason) && (
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02), borderRight: `3px solid ${item.rejectionReason ? statusColors.Rejected : statusColor}` }}>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
                        {item.rejectionReason ? 'دلیل رد قبلی' : 'یادداشت'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {item.rejectionReason || item.statusNote}
                      </Typography>
                    </Box>
                  )}

                  {!loaded && !failed && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                      ))}
                    </Box>
                  )}

                  {!loaded && failed && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                      <InfoChip icon={<PersonIcon sx={{ fontSize: 16 }} />} label="ثبت‌کننده" value={item.ownerName || '-'} color={statusColor} isDark={isDark} />
                      <InfoChip icon={<CargoIcon sx={{ fontSize: 16 }} />} label="نوع بار" value={item.cargoTypeName || '-'} color={statusColor} isDark={isDark} />
                      <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="آخرین ویرایش" value={formatDateTime(item.modifiedDate)} color={statusColor} isDark={isDark} />
                      <InfoChip icon={<ViewIcon sx={{ fontSize: 16 }} />} label="جزئیات کامل" value="در دسترس نیست" color={statusColor} isDark={isDark} />
                    </Box>
                  )}

                  {loaded && (
                    <>
                      {cargo!.cargoDescription && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02), borderRight: `3px solid ${statusColor}` }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                            {cargo!.cargoDescription.length > 160 ? cargo!.cargoDescription.substring(0, 160) + '...' : cargo!.cargoDescription}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                        <InfoChip icon={<WeightIcon sx={{ fontSize: 16 }} />} label="وزن" value={cargo!.cargoWeight ? `${cargo!.cargoWeight} ${cargo!.cargoWeightUnit === 'Ton' ? 'تن' : cargo!.cargoWeightUnit || 'تن'}` : '-'} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<VehicleIcon sx={{ fontSize: 16 }} />} label="نوع وسیله" value={cargo!.vehicleType || '-'} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="تاریخ بارگیری" value={formatDate(cargo!.loadingDate)} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<MoneyIcon sx={{ fontSize: 16 }} />} label="قیمت" value={formatPrice(cargo!.freightCast, cargo!.currency, cargo!.freightDisplayText)} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="تماس" value={cargo!.contactPhoneNumber || '-'} color={statusColor} isDark={isDark} ltr />
                        <InfoChip icon={<PersonIcon sx={{ fontSize: 16 }} />} label="نام تماس" value={cargo!.contactPersonName || '-'} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="تاریخ ثبت" value={formatDate(cargo!.createdDate)} color={statusColor} isDark={isDark} />
                        <InfoChip icon={<ViewIcon sx={{ fontSize: 16 }} />} label="بازدید" value={(cargo!.viewCount || 0).toLocaleString('fa-IR')} color={statusColor} isDark={isDark} />
                      </Box>
                    </>
                  )}
                </CardContent>

                <Divider />

                {/* reject reason */}
                <Collapse in={isRejecting}>
                  <Box sx={{ px: 3, pt: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.25) }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'error.main' }}>
                        دلیل رد بار (الزامی)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        placeholder="دلیل رد بار را وارد کنید..."
                        value={rejectReasons[item.cargoLoadID] || ''}
                        onChange={(e) => setRejectReasons((prev) => ({ ...prev, [item.cargoLoadID]: e.target.value }))}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
                        <Button size="small" color="inherit" onClick={() => setRejectingId(null)} sx={{ borderRadius: 2 }}>
                          انصراف
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleReject(item)}
                          disabled={busy || !(rejectReasons[item.cargoLoadID] || '').trim()}
                          startIcon={busy ? undefined : <RejectIcon />}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          تایید رد بار
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Collapse>

                {/* actions */}
                {!isRejecting && (
                  <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => openDetail(item.cargoLoadID)}
                      sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
                    >
                      مشاهده جزئیات
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => setRejectingId(item.cargoLoadID)}
                        disabled={busy}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        رد بار
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleApprove(item)}
                        disabled={busy}
                        sx={{ borderRadius: 2, fontWeight: 600, boxShadow: `0 4px 14px ${alpha('#4caf50', 0.35)}` }}
                      >
                        تأیید و انتشار
                      </Button>
                    </Box>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={Boolean(detailId)} onClose={() => setDetailId(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        {detailItem && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <CargoIcon color="primary" />
                <Typography sx={{ fontWeight: 700 }}>جزئیات بار</Typography>
                {detailItem.referenceNumber && (
                  <Chip label={detailItem.referenceNumber} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                )}
                <Chip
                  label={statusLabels[normalizeStatus(detailItem.status)] || normalizeStatus(detailItem.status)}
                  size="small"
                  sx={{
                    bgcolor: alpha(statusColors[normalizeStatus(detailItem.status)] || '#ff9800', 0.15),
                    color: statusColors[normalizeStatus(detailItem.status)] || '#ff9800',
                    fontWeight: 700,
                  }}
                />
              </Box>
              <IconButton onClick={() => setDetailId(null)}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
              {detailError && !detailCargo && (
                <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }} onClose={() => setDetailError(null)}>
                  {detailError}
                </Alert>
              )}

              {!detailCargo && !detailError && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {detailLoading && (
                    <Typography variant="caption" color="text.secondary">در حال بارگذاری جزئیات بار...</Typography>
                  )}
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              )}

              {detailCargo && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, p: 2, mb: 2, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.04) : alpha(theme.palette.primary.main, 0.04), border: '1px dashed', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">مبدأ</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{detailCargo.originCity || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{detailCargo.originProvince}</Typography>
                    </Box>
                    <EastIcon color="primary" />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">مقصد</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{detailCargo.destinationCity || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{detailCargo.destinationProvince}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {detailCargo.cargoDescription || 'بدون توضیحات'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 2 }}>
                    {detailCargo.isUrgent && <Chip icon={<RouteIcon />} label="فوری" color="error" size="small" />}
                    {detailCargo.requiresInsurance && <Chip label="نیاز به بیمه" color="warning" size="small" />}
                    {detailCargo.requiresPermit && <Chip label="نیاز به مجوز" color="info" size="small" />}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                    <InfoChip icon={<WeightIcon sx={{ fontSize: 16 }} />} label="وزن" value={detailCargo.cargoWeight ? `${detailCargo.cargoWeight} ${detailCargo.cargoWeightUnit === 'Ton' ? 'تن' : detailCargo.cargoWeightUnit || 'تن'}` : '-'} color={theme.palette.primary.main} isDark={isDark} />
                    <InfoChip icon={<VehicleIcon sx={{ fontSize: 16 }} />} label="نوع وسیله" value={detailCargo.vehicleType || '-'} color={theme.palette.primary.main} isDark={isDark} />
                    <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="تاریخ بارگیری" value={formatDate(detailCargo.loadingDate)} color={theme.palette.primary.main} isDark={isDark} />
                    <InfoChip icon={<MoneyIcon sx={{ fontSize: 16 }} />} label="قیمت" value={formatPrice(detailCargo.freightCast, detailCargo.currency, detailCargo.freightDisplayText)} color={theme.palette.primary.main} isDark={isDark} />
                    <InfoChip icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="تماس" value={detailCargo.contactPhoneNumber || '-'} color={theme.palette.primary.main} isDark={isDark} ltr />
                    <InfoChip icon={<PersonIcon sx={{ fontSize: 16 }} />} label="نام تماس" value={detailCargo.contactPersonName || '-'} color={theme.palette.primary.main} isDark={isDark} />
                  </Box>

                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                <InfoChip icon={<PersonIcon sx={{ fontSize: 16 }} />} label="ثبت‌کننده" value={detailItem.ownerName || '-'} color={theme.palette.primary.main} isDark={isDark} />
                <InfoChip icon={<CargoIcon sx={{ fontSize: 16 }} />} label="نوع بار" value={detailItem.cargoTypeName || '-'} color={theme.palette.primary.main} isDark={isDark} />
                <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="آخرین ویرایش" value={formatDateTime(detailItem.modifiedDate)} color={theme.palette.primary.main} isDark={isDark} />
                {detailItem.statusNote && (
                  <InfoChip icon={<ViewIcon sx={{ fontSize: 16 }} />} label="یادداشت وضعیت" value={detailItem.statusNote} color={theme.palette.primary.main} isDark={isDark} />
                )}
                {detailItem.rejectionReason && (
                  <InfoChip icon={<RejectIcon sx={{ fontSize: 16 }} />} label="دلیل رد قبلی" value={detailItem.rejectionReason} color={statusColors.Rejected} isDark={isDark} />
                )}
                {detailItem.rejectedDate && (
                  <InfoChip icon={<DateIcon sx={{ fontSize: 16 }} />} label="تاریخ رد" value={formatDateTime(detailItem.rejectedDate)} color={statusColors.Rejected} isDark={isDark} />
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setDetailId(null)} color="inherit">بستن</Button>
              <Button variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => { const id = detailItem.cargoLoadID; setDetailId(null); setRejectingId(id); }}>
                رد بار
              </Button>
              <Button variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => { const item = detailItem; setDetailId(null); handleApprove(item); }}>
                تأیید و انتشار
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function InfoChip({
  icon,
  label,
  value,
  color,
  isDark,
  ltr,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  isDark: boolean;
  ltr?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.1), color: color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(ltr ? { direction: 'ltr', textAlign: 'right' } : {}) }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
