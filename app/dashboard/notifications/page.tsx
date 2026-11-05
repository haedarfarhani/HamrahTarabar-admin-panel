'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  ExpandMore as ExpandMoreIcon,
  MarkEmailRead as MarkReadIcon,
  Send as SendIcon,
  CheckCircle as OkIcon,
  ErrorOutlined as ErrorIcon,
  WarningAmber as WarnIcon,
  Dns as DnsIcon,
  CloudQueue as QueueIcon,
  Tune as TuneIcon,
  Science as ScienceIcon,
  SupportAgent as SupportIcon,
  InfoOutlined as InfoIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import {
  NotificationAlertDto,
  NotificationAlertStatus,
  NotificationDiagnosticsDto,
  NotificationTestSendResultDto,
  getNotificationAlerts,
  getNotificationDiagnostics,
  sendTestNotification,
} from '@/app/lib/api';
import { useNotificationStore } from '@/app/lib/notification-store';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import {
  faNum,
  formatFaDate,
  formatFaDateTime,
  getPayloadLabel,
  getStatusMeta,
  getTargetAppMeta,
  getTypeCodeMeta,
  parsePayload,
} from '@/app/lib/notification-meta';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';

type PageTab = 'mine' | 'history' | 'health';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_FILTERS: { value: NotificationAlertStatus | ''; label: string }[] = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'Pending', label: 'در صف' },
  { value: 'Processing', label: 'در حال ارسال' },
  { value: 'Delivered', label: 'ارسال‌شده' },
  { value: 'Failed', label: 'ناموفق' },
  { value: 'Suppressed', label: 'سرکوب‌شده' },
];

/* ───────── اجزای کمکی ───────── */

function StatusPill({ status }: { status?: string | null }) {
  const meta = getStatusMeta(status);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: alpha(meta.color, 0.12),
        border: `1px solid ${alpha(meta.color, 0.22)}`,
        color: meta.color,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: meta.color,
          boxShadow: `0 0 0 3px ${alpha(meta.color, 0.18)}`,
        }}
      />
      {meta.label}
    </Box>
  );
}

function MetaRow({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        dir={ltr ? 'ltr' : undefined}
        sx={{ fontWeight: 600, fontSize: 12.5, textAlign: ltr ? 'right' : 'inherit' }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
  sx,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: object;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha(theme.palette.primary.main, 0.025),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function KpiCard({
  label,
  value,
  caption,
  color,
  icon,
}: {
  label: string;
  value: string;
  caption?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.10)}, ${alpha(color, 0.02)})`,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
          boxShadow: `0 6px 16px ${alpha(color, 0.35)}`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
          {label}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
            {caption}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

/* ───────── کارت اعلان ───────── */

function AlertCard({
  alert,
  expanded,
  onToggle,
}: {
  alert: NotificationAlertDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const meta = getTypeCodeMeta(alert.typeCode);
  const target = getTargetAppMeta(alert.targetApp);
  const isRead = Boolean(alert.readAtUtc);
  const payload = parsePayload(alert.payload);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: isRead ? 'divider' : alpha(theme.palette.primary.main, 0.3),
        bgcolor: isRead
          ? 'transparent'
          : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.035),
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: alpha(meta.color, 0.45),
          boxShadow: `0 6px 20px ${alpha(meta.color, 0.1)}`,
        },
      }}
    >
      <Box
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onToggle();
        }}
        sx={{ p: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start', cursor: 'pointer' }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: `linear-gradient(135deg, ${meta.color}, ${alpha(meta.color, 0.72)})`,
            boxShadow: `0 6px 16px ${alpha(meta.color, 0.3)}`,
          }}
        >
          <meta.icon sx={{ fontSize: 21 }} />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.25 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: isRead ? 600 : 800 }} noWrap>
              {alert.title || meta.title}
            </Typography>
            {!isRead && (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
            {alert.message || '—'}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
            <StatusPill status={alert.status} />
            <Chip
              size="small"
              label={target.label}
              variant="outlined"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                borderColor: alpha(target.color, 0.4),
                color: target.color,
              }}
            />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
              {formatFaDateTime(alert.createdDate)}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {isRead && (
            <Tooltip title="خوانده‌شده">
              <MarkReadIcon sx={{ fontSize: 18, color: 'success.main' }} />
            </Tooltip>
          )}
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              color: 'text.disabled',
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          />
        </Box>
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Divider />
        <Box sx={{ p: 1.75, bgcolor: alpha(theme.palette.text.primary, 0.015) }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetaRow label="کد رویداد" value={alert.typeCode || '—'} ltr />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetaRow label="اپلیکیشن هدف" value={target.label} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetaRow label="زمان ایجاد" value={formatFaDateTime(alert.createdDate)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetaRow
                label="وضعیت خوانده‌شدن"
                value={isRead ? formatFaDateTime(alert.readAtUtc) : 'خوانده‌نشده'}
              />
            </Grid>
            {alert.cargoLoadId && (
              <Grid size={{ xs: 6, md: 3 }}>
                <MetaRow label="شناسه بار" value={alert.cargoLoadId} ltr />
              </Grid>
            )}
          </Grid>

          {payload && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }} color="text.secondary">
                جزئیات رویداد
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {Object.entries(payload).map(([key, value]) => (
                  <Grid size={{ xs: 6, md: 3 }} key={key}>
                    <MetaRow label={getPayloadLabel(key)} value={value} ltr={key.toLowerCase().endsWith('id')} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

/* ───────── صفحه‌بندی ───────── */

function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        نمایش {faNum(rangeStart)} تا {faNum(rangeEnd)} از {faNum(total)} مورد
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 32 } }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <MenuItem key={size} value={size}>
              {faNum(size)}
            </MenuItem>
          ))}
        </TextField>
        <Pagination
          count={totalPages}
          page={Math.min(page, totalPages)}
          onChange={(_event, value) => onPageChange(value)}
          size="small"
          shape="rounded"
          color="primary"
          siblingCount={0}
          boundaryCount={1}
        />
      </Stack>
    </Box>
  );
}

/* ───────── اجزای پنل سلامت ───────── */

function StatRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          bgcolor: alpha(color, 0.12),
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 1.5,
        py: 1.1,
        borderRadius: 2,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        dir="ltr"
        sx={{ fontWeight: 700, fontSize: 12.5, textAlign: 'right', flexShrink: 0 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/* ───────── صفحه‌ی اصلی ───────── */

export default function NotificationsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [tab, setTab] = useState<PageTab>('mine');

  // ── اعلان‌های من ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── تاریخچه‌ی ارسال ──
  const [historyStatus, setHistoryStatus] = useState<NotificationAlertStatus | ''>('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [historyItems, setHistoryItems] = useState<NotificationAlertDto[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // ── سلامت سامانه ──
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnosticsDto | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState('Driver');
  const [testResult, setTestResult] = useState<NotificationTestSendResultDto | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [readAllConfirmOpen, setReadAllConfirmOpen] = useState(false);

  const showToast = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleReadAll = async () => {
    setReadAllConfirmOpen(false);
    await markAllRead();
    showToast('همه‌ی اعلان‌های سامانه خوانده‌شده شد', 'success');
    loadMyAlerts({ page, pageSize });
    loadSummary();
  };

  const badge = useNotificationStore((state) => state.badge);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const myAlerts = useNotificationStore((state) => state.myAlerts);
  const myAlertsTotal = useNotificationStore((state) => state.myAlertsTotal);
  const alertsLoading = useNotificationStore((state) => state.alertsLoading);
  const loadSummary = useNotificationStore((state) => state.loadSummary);
  const loadMyAlerts = useNotificationStore((state) => state.loadMyAlerts);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  // ── اعلان‌های من ──
  useEffect(() => {
    loadMyAlerts({ page, pageSize });
  }, [loadMyAlerts, page, pageSize]);

  const openMineDetail = (alertId: string) => {
    const willExpand = expandedId !== alertId;
    setExpandedId(willExpand ? alertId : null);
    if (willExpand) {
      markRead(alertId);
    }
  };

  const handleHistoryFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryStatus((event.target.value ?? '') as NotificationAlertStatus | '');
    setHistoryPage(1);
  };

  // ── تاریخچه‌ی ارسال ──
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getNotificationAlerts({
        status: historyStatus,
        page: historyPage,
        pageSize: historyPageSize,
      });
      if (response.success && response.data) {
        setHistoryItems(response.data.items ?? []);
        setHistoryTotal(response.data.totalCount ?? 0);
      }
    } catch (err: unknown) {
      setHistoryError(extractApiErrorMessage(err, 'خطا در دریافت تاریخچه ارسال'));
    } finally {
      setHistoryLoading(false);
    }
  }, [historyStatus, historyPage, historyPageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, [fetchHistory]);

  // ── سلامت سامانه ──
  const fetchDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    setTestResult(null);
    try {
      const response = await getNotificationDiagnostics();
      setDiagnostics(response.success ? response.data ?? null : null);
    } catch (err: unknown) {
      setDiagnosticsError(extractApiErrorMessage(err, 'خطا در دسترسی به وضعیت پیکربندی'));
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const handleTestPush = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      const response = await sendTestNotification(testTarget || undefined);
      if (response.success && response.data) {
        setTestResult(response.data);
        showToast(
          response.data.accepted
            ? `پوش آزمایشی با موفقیت به ${response.data.targetApp ?? ''} ارسال شد.`
            : response.data.message ?? 'پوش آزیمی نتواند ارسال شد',
          response.data.accepted ? 'success' : 'error'
        );
      } else {
        setTestError(response.message ?? 'خطای ارسال پوش آزمایشی');
      }
    } catch (err: unknown) {
      setTestError(extractApiErrorMessage(err, 'خطا در ارسال پوش آزمایشی'));
      showToast(extractApiErrorMessage(err, 'خطا در ارسال پوش آزمایشی'), 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const totalPending = badge + unreadCount;
  const statusCounts: Record<string, number> = diagnostics?.alertsByStatus
    ? Object.entries(diagnostics.alertsByStatus).reduce<Record<string, number>>(
        (acc, [status, count]) => ({ ...acc, [status]: Number(count) }),
        {}
      )
    : {};
  const deliveredCount = statusCounts.Delivered ?? 0;
  const failedCount = statusCounts.Failed ?? 0;

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <NotificationsIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
              اعلان‌ها
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Box
                component="span"
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: totalPending > 0 ? 'error.main' : 'success.main',
                  boxShadow: (t) =>
                    `0 0 0 3px ${alpha(t.palette[totalPending > 0 ? 'error' : 'success'].main, 0.18)}`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {totalPending > 0
                  ? `${faNum(totalPending)} اعلان در انتظار اقدام`
                  : 'همه‌ی اعلان‌ها بررسی شده‌اند'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="بروزرسانی">
            <IconButton
              onClick={() => {
                loadSummary();
                loadMyAlerts({ page, pageSize });
              }}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<ScienceIcon />}
            onClick={() => setTab('health')}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            ارسال پوش آزمایشی
          </Button>
        </Box>
      </Box>

      {/* ── KPI ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="نیازمند پیگیری"
            value={faNum(badge)}
            caption="بار، پیشنهاد، پشتیبانی و نظر"
            color="#ef6c00"
            icon={<WarnIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="خوانده‌نشده"
            value={faNum(unreadCount)}
            caption="اعلان‌های شخصی شما"
            color="#d32f2f"
            icon={<NotificationsIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="ارسال موفق"
            value={faNum(deliveredCount)}
            caption="پذیرفته‌شده توسط OneSignal"
            color="#2e7d32"
            icon={<OkIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="ارسال ناموفق"
            value={faNum(failedCount)}
            caption="نیازمند بررسی و تلاش مجدد"
            color="#6a1b9a"
            icon={<ErrorIcon />}
          />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
      >
        <Tabs
          value={tab}
          onChange={(_event, value: PageTab) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 52, fontWeight: 800 },
          }}
        >
          <Tab value="mine" label="همه‌ی اعلان‌ها" />
          <Tab value="history" label="تاریخچه‌ی ارسال" />
          <Tab value="health" label="سلامت سامانه" />
        </Tabs>

        {/* ── Tab: اعلان‌های من ── */}
        {tab === 'mine' && (
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  {faNum(myAlertsTotal)} اعلان در سامانه
                </Typography>
              </Stack>

              <Button
                size="small"
                color="inherit"
                startIcon={<DoneAllIcon />}
                disabled={!myAlerts.some((item) => !item.readAtUtc)}
                onClick={() => setReadAllConfirmOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                خواندن همه
              </Button>
            </Box>

            {alertsLoading && myAlerts.length === 0 && (
              <Stack spacing={1.5}>
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} variant="rounded" height={92} sx={{ borderRadius: 2.5 }} />
                ))}
              </Stack>
            )}

            {!alertsLoading && myAlerts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: { xs: 6, md: 9 } }}>
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.55) }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
                  اعلانی یافت نشد
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>
                  در حال حاضر هیچ اعلانی در سامانه ثبت نشده است.
                </Typography>
              </Box>
            )}

            <Stack spacing={1.5}>
              {myAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  expanded={expandedId === alert.id}
                  onToggle={() => openMineDetail(alert.id)}
                />
              ))}
            </Stack>

            {myAlertsTotal > 0 && (
              <Pager
                page={page}
                pageSize={pageSize}
                total={myAlertsTotal}
                onPageChange={(value) => setPage(value)}
                onPageSizeChange={(value) => {
                  setPageSize(value);
                  setPage(1);
                }}
              />
            )}
          </Box>
        )}

        {/* ── Tab: تاریخچه‌ی ارسال ── */}
        {tab === 'history' && (
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TuneIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                <TextField
                  select
                  size="small"
                  label="وضعیت"
                  value={historyStatus}
                  onChange={handleHistoryFilter}
                  sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {STATUS_FILTERS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {faNum(historyTotal)} رکورد در تاریخچه
              </Typography>
            </Box>

            {historyError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setHistoryError(null)}>
                {historyError}
              </Alert>
            )}

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {historyLoading && historyItems.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <Skeleton key={index} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                </Box>
              ) : historyItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <DnsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                    رکوردی یافت نشد
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>
                    {historyStatus
                      ? 'برای این وضعیت اعلانی در تاریخچه وجود ندارد.'
                      : 'هنوز اعلانی در سیستم ثبت نشده است.'}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="medium" sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          '& th': {
                            py: 1.4,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'text.secondary',
                            bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012),
                            borderColor: 'divider',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      >
                        <TableCell sx={{ pr: 2.5 }}>رویداد</TableCell>
                        <TableCell>پیام</TableCell>
                        <TableCell>مقصد</TableCell>
                        <TableCell>وضعیت</TableCell>
                        <TableCell>خوانده‌شدن</TableCell>
                        <TableCell>زمان ایجاد</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyItems.map((alert) => {
                        const meta = getTypeCodeMeta(alert.typeCode);
                        const target = getTargetAppMeta(alert.targetApp);
                        return (
                          <TableRow
                            key={alert.id}
                            hover
                            sx={{
                              '&:last-child td': { borderBottom: 0 },
                              '& td': { py: 1.4, borderColor: 'divider' },
                            }}
                          >
                            <TableCell sx={{ pr: 2.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 1.8,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: meta.color,
                                    bgcolor: alpha(meta.color, 0.12),
                                  }}
                                >
                                  <meta.icon sx={{ fontSize: 17 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                    {alert.title || meta.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    dir="ltr"
                                    sx={{ display: 'block', fontSize: 10.5 }}
                                    noWrap
                                  >
                                    {alert.typeCode || '—'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ maxWidth: 320, fontSize: 12.5 }}
                                noWrap
                              >
                                {alert.message || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={target.label}
                                variant="outlined"
                                sx={{
                                  height: 24,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  borderRadius: 999,
                                  borderColor: alpha(target.color, 0.4),
                                  color: target.color,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <StatusPill status={alert.status} />
                            </TableCell>
                            <TableCell>
                              {alert.readAtUtc ? (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                  <OkIcon sx={{ fontSize: 15, color: 'success.main' }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5 }}>
                                    {formatFaDate(alert.readAtUtc)}
                                  </Typography>
                                </Stack>
                              ) : (
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11.5 }}>
                                  خوانده‌نشده
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: 12.5, whiteSpace: 'nowrap' }}
                              >
                                {formatFaDateTime(alert.createdDate)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Pager
                page={historyPage}
                pageSize={historyPageSize}
                total={historyTotal}
                onPageChange={(value) => setHistoryPage(value)}
                onPageSizeChange={(value) => {
                  setHistoryPageSize(value);
                  setHistoryPage(1);
                }}
              />
            </Paper>
          </Box>
        )}

        {/* ── Tab: سلامت سامانه ── */}
        {tab === 'health' && (
          <Grid container spacing={2} sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Grid size={{ xs: 12 }}>
              <Panel
                title="کل وضعیت"
                icon={<SupportIcon sx={{ color: 'text.secondary' }} />}
                action={
                  diagnosticsError ? (
                    <Chip size="small" color="error" label="خطا در دریافت وضعیت" />
                  ) : diagnosticsLoading ? (
                    <CircularProgress size={18} />
                  ) : null
                }
              >
                {diagnostics?.diagnosis && (
                  <Alert
                    severity={
                      diagnostics.canDeliver ? 'success' : 'warning'
                    }
                    sx={{ borderRadius: 2.5, mb: 2 }}
                  >
                    {diagnostics.diagnosis}
                  </Alert>
                )}
                <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                  <StatRow
                    label="ارسال موفق"
                    value={faNum(statusCounts.Delivered ?? 0)}
                    color="#2e7d32"
                    icon={<OkIcon />}
                  />
                  <StatRow
                    label="در صف"
                    value={faNum(statusCounts.Pending ?? 0)}
                    color="#0288d1"
                    icon={<QueueIcon />}
                  />
                  <StatRow
                    label="در حال ارسال"
                    value={faNum(statusCounts.Processing ?? 0)}
                    color="#ed6c02"
                    icon={<WarnIcon />}
                  />
                  <StatRow
                    label="ناموفق"
                    value={faNum(statusCounts.Failed ?? 0)}
                    color="#d32f2f"
                    icon={<ErrorIcon />}
                  />
                  <StatRow
                    label="سرکوب‌شده"
                    value={faNum(statusCounts.Suppressed ?? 0)}
                    color="#616161"
                    icon={<InfoIcon />}
                  />
                </Stack>
              </Panel>
            </Grid>

            {/* ── کانال‌های OneSignal ── */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Panel title="پیکربندی کانال‌ها (OneSignal)" icon={<DnsIcon />}>
                {diagnosticsLoading || !diagnostics ? (
                  <Stack spacing={1.5}>
                    {[0, 1, 2].map((index) => (
                      <Skeleton key={index} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : (diagnostics.channels ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    هیچ کانالی برای نمایش وجود ندارد.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {(diagnostics.channels ?? []).map((channel, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', p: 1.75 }}
                      >
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <CampaignIcon
                            sx={{
                              color: channel.configured ? 'success.main' : 'error.main',
                              fontSize: 20,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                              {channel.targetApp ?? 'نامشخص'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', fontSize: 11 }}
                            >
                              {channel.note ??
                                (channel.configured
                                  ? 'پیکربندی شده و آماده‌ی ارسال است.'
                                  : 'پیکربندی نشده است؛ ارسال برای این کانال انجام نمی‌شود.')}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={channel.configured ? 'پیکربندی‌شده' : 'پیکربندی‌نشده'}
                            color={channel.configured ? 'success' : 'default'}
                            variant={channel.configured ? 'filled' : 'outlined'}
                            sx={{
                              height: 24,
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          />
                        </Stack>
                        {channel.appIdHint && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
                            App ID: {channel.appIdHint}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Panel>
            </Grid>

            {/* ── صف ارسال ── */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Panel title="صف ارسال" icon={<QueueIcon />}>
                {diagnosticsLoading || !diagnostics ? (
                  <Stack spacing={1.5}>
                    {[0, 1, 2].map((index) => (
                      <Skeleton key={index} variant="rounded" height={44} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <StatRow
                      label="آماده‌ی ارسال در این لحظه"
                      value={faNum(diagnostics.dueNow ?? 0)}
                      color="#ed6c02"
                      icon={<QueueIcon />}
                    />
                    <StatRow
                      label="در حال ارسال توسط ورکر"
                      value={faNum(diagnostics.processingNow ?? 0)}
                      color="#0288d1"
                      icon={<DnsIcon />}
                    />
                    <StatRow
                      label="ادعای منقضی‌شده"
                      value={faNum(diagnostics.staleClaims ?? 0)}
                      color="#6a1b9a"
                      icon={<WarnIcon />}
                    />
                    <Divider />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <MetaRow
                          label="قدیمی‌ترین اعلان در صف"
                          value={formatFaDateTime(diagnostics.oldestPendingAtUtc)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <MetaRow
                          label="زمان تلاش مجدد بعدی"
                          value={formatFaDateTime(diagnostics.nextRetryAtUtc)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <MetaRow
                          label="آخرین ارسال موفق"
                          value={formatFaDateTime(diagnostics.lastDeliveryAtUtc)}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                )}
              </Panel>
            </Grid>

            {/* ── پیکربندی ارسال ── */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Panel title="پیکربندی ارسال" icon={<TuneIcon />}>
                {diagnosticsLoading || !diagnostics ? (
                  <Stack spacing={1.5}>
                    {[0, 1, 2, 3].map((index) => (
                      <Skeleton key={index} variant="rounded" height={42} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1.25}>
                    <ConfigRow label="مسیر پایه (BasePath)" value={diagnostics.basePath ?? '—'} />
                    <ConfigRow label="مهلت پاسخ (Timeout)" value={`${diagnostics.timeoutSeconds ?? '—'} ثانیه`} />
                    <ConfigRow label="حداکثر تلاش مجدد" value={`${diagnostics.maxAttempts ?? '—'} بار`} />
                    <ConfigRow
                      label="تأخیر پایه‌ی تلاش مجدد"
                      value={`${diagnostics.baseRetryDelaySeconds ?? '—'} ثانیه`}
                    />
                    <ConfigRow
                      label="بیشینه‌ی تأخیر تلاش مجدد"
                      value={`${diagnostics.maxRetryDelaySeconds ?? '—'} ثانیه`}
                    />
                    <ConfigRow
                      label="امکان ارسال"
                      value={diagnostics.canDeliver ? 'بله — حداقل یک کانال پیکربندی شده' : 'خیر — هیچ کانالی پیکربندی نشده'}
                    />
                  </Stack>
                )}
              </Panel>
            </Grid>

            {/* ── پایگاه داده ── */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Panel title="پایگاه داده" icon={<ScienceIcon />}>
                {diagnosticsLoading || !diagnostics ? (
                  <Stack spacing={1.5}>
                    {[0, 1, 2].map((index) => (
                      <Skeleton key={index} variant="rounded" height={42} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1.25}>
                    <StatRow
                      label={diagnostics.database?.canConnect === false ? 'اتصال برقرار نیست' : 'اتصال برقرار است'}
                      value={diagnostics.database?.canConnect === false ? 'خطا' : 'سالم'}
                      color={diagnostics.database?.canConnect === false ? '#d32f2f' : '#2e7d32'}
                      icon={diagnostics.database?.canConnect === false ? <ErrorIcon /> : <OkIcon />}
                    />
                    <ConfigRow label="نام پایگاه داده" value={diagnostics.database?.databaseName ?? '—'} />
                    <ConfigRow
                      label="آخرین مهاجرت اعمال‌شده"
                      value={diagnostics.database?.appliedLatestMigration ?? '—'}
                    />
                    <ConfigRow
                      label="مهاجرت‌های اعمال‌نشده"
                      value={diagnostics.database?.pendingMigrations?.join('، ') || '—'}
                    />
                    {diagnostics.database?.error && (
                      <Alert severity="error" sx={{ mt: 0.5, borderRadius: 2 }}>
                        {diagnostics.database.error}
                      </Alert>
                    )}
                  </Stack>
                )}
              </Panel>
            </Grid>

            {/* ── آخرین خطاها ── */}
            <Grid size={{ xs: 12 }}>
              <Panel title="آخرین خطاها و سرکوب‌ها" icon={<ErrorIcon />}>
                {diagnosticsLoading || !diagnostics ? (
                  <Stack spacing={1.5}>
                    {[0, 1].map((index) => (
                      <Skeleton key={index} variant="rounded" height={44} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : diagnostics.lastFailureReason || diagnostics.lastSuppressedReason ? (
                  <Stack spacing={1.25}>
                    {diagnostics.lastFailureReason && (
                      <Alert severity="error" sx={{ borderRadius: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                          آخرین خطای ارسال
                        </Typography>
                        {diagnostics.lastFailureReason}
                      </Alert>
                    )}
                    {diagnostics.lastSuppressedReason && (
                      <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                          آخرین ارسال سرکوب‌شده
                        </Typography>
                        {diagnostics.lastSuppressedReason}
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    خطای ثبت‌شده‌ای وجود ندارد؛ آخرین تلاش‌ها موفق بوده‌اند.
                  </Typography>
                )}
              </Panel>
            </Grid>

            {/* ── پوش آزمایشی ── */}
            <Grid size={{ xs: 12 }}>
              <Panel title="ارسال پوش آزمایشی" icon={<SendIcon />}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  یک پوش آزمایشی واقعی به شناسه‌ی خارجی (External Id) خودِ شما ارسال می‌شود تا اتصال بک‌اند به
                  OneSignal بدون درگیر کردن دستگاه کاربران دیگر بررسی شود.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                  <TextField
                    select
                    size="small"
                    label="اپلیکیشن هدف"
                    value={testTarget}
                    onChange={(event) => setTestTarget(event.target.value)}
                    sx={{ width: 210, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    <MenuItem value="Driver">راننده</MenuItem>
                    <MenuItem value="CargoOwner">صاحب بار</MenuItem>
                    <MenuItem value="">پیش‌فرض سرور</MenuItem>
                  </TextField>
                  <Button
                    variant="contained"
                    startIcon={testLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    onClick={handleTestPush}
                    disabled={testLoading}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 2.5,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                    }}
                  >
                    {testLoading ? 'در حال ارسال...' : 'ارسال پوش آزمایشی'}
                  </Button>
                </Stack>

                {testResult && (
                  <Alert
                    severity={testResult.accepted ? 'success' : 'error'}
                    sx={{ borderRadius: 2.5, mt: 2 }}
                  >
                    {testResult.accepted ? (
                      <>
                        پوش آزمایشی با موفقیت به {testResult.targetApp ?? 'مقصد'} ارسال شد.
                        {testResult.oneSignalNotificationId && (
                          <>
                            {' '}
                            شناسه‌ی OneSignal:{' '}
                            <Typography
                              component="span"
                              dir="ltr"
                              sx={{ fontWeight: 800, display: 'inline-block' }}
                            >
                              {testResult.oneSignalNotificationId}
                            </Typography>
                          </>
                        )}
                      </>
                    ) : (
                      <>ارسال انجام نشد: {testResult.message ?? 'دلیل نامشخص'}</>
                    )}
                  </Alert>
                )}
                {testError && (
                  <Alert severity="error" sx={{ borderRadius: 2.5, mt: 2 }}>
                    {testError}
                  </Alert>
                )}
              </Panel>
            </Grid>
          </Grid>
        )}
      </Paper>

      <ConfirmDialog
        open={readAllConfirmOpen}
        title="خواندن همه‌ی اعلان‌ها"
        message="همه‌ی اعلان‌های خوانده‌نشده‌ی سامانه — برای تمام کاربران — خوانده‌شده علامت می‌خورند. این عملیات برگشت‌پذیر نیست."
        confirmText="بله، همه خوانده شوند"
        cancelText="انصراف"
        severity="warning"
        onConfirm={handleReadAll}
        onCancel={() => setReadAllConfirmOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

