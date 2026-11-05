'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNotificationStore } from '@/app/lib/notification-store';
import {
  faNum,
  formatFaDateTime,
  getDashboardKindMeta,
  getPayloadLabel,
  getStatusMeta,
  getTargetAppMeta,
  getTypeCodeMeta,
  parsePayload,
  relativeTime,
} from '@/app/lib/notification-meta';

type PanelTab = 'attention' | 'mine';

function IconTile({
  icon: Icon,
  color,
  size = 38,
  filled = false,
}: {
  icon: React.ElementType;
  color: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2.2,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: filled ? '#fff' : color,
        bgcolor: filled ? color : alpha(color, 0.12),
        boxShadow: filled ? `0 4px 12px ${alpha(color, 0.35)}` : 'none',
      }}
    >
      <Icon sx={{ fontSize: size * 0.52 }} />
    </Box>
  );
}

export default function NotificationCenter() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tab, setTab] = useState<PanelTab>('attention');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const badge = useNotificationStore((state) => state.badge);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const dashboardItems = useNotificationStore((state) => state.dashboardItems);
  const myAlerts = useNotificationStore((state) => state.myAlerts);
  const myAlertsTotal = useNotificationStore((state) => state.myAlertsTotal);
  const alertsLoading = useNotificationStore((state) => state.alertsLoading);
  const summaryLoading = useNotificationStore((state) => state.summaryLoading);
  const loadSummary = useNotificationStore((state) => state.loadSummary);
  const loadMyAlerts = useNotificationStore((state) => state.loadMyAlerts);
  const markRead = useNotificationStore((state) => state.markRead);

  const totalPending = badge + unreadCount;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setExpandedId(null);
    loadSummary();
    loadMyAlerts({ page: 1, pageSize: 20 });
  };

  const handleClose = () => setAnchorEl(null);

  const goToAll = () => {
    setAnchorEl(null);
    router.push('/dashboard/notifications');
  };

  const openItem = (href?: string | null) => {
    if (!href) return;
    setAnchorEl(null);
    router.push(href);
  };

  const handleAlertClick = (alertId: string) => {
    setExpandedId((prev) => (prev === alertId ? null : alertId));
    if (expandedId !== alertId) markRead(alertId);
  };

  return (
    <>
      <Tooltip title={totalPending > 0 ? `${faNum(totalPending)} اعلان جدید` : 'اعلان‌ها'}>
        <IconButton onClick={handleOpen} aria-label="اعلان‌ها">
          <Badge
            badgeContent={totalPending > 0 ? (totalPending > 99 ? '۹۹+' : faNum(totalPending)) : undefined}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 10,
                height: 17,
                minWidth: 17,
                fontWeight: 800,
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 360, sm: 420 },
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              mt: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, isDark ? 0.55 : 0.16)}`,
            },
          },
        }}
      >
        {/* ── Header ── */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
              اعلان‌ها
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalPending > 0 ? `${faNum(totalPending)} مورد برای پیگیری` : 'همه‌چیز به‌روز است'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Tooltip title="بروزرسانی">
              <IconButton
                size="small"
                onClick={() => {
                  loadSummary();
                  loadMyAlerts({ page: 1, pageSize: 20 });
                }}
                disabled={summaryLoading}
                sx={{ color: 'text.secondary' }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="صفحه‌ی اعلان‌ها">
              <IconButton size="small" onClick={goToAll} sx={{ color: 'text.secondary' }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_event, value: PanelTab) => setTab(value)}
          variant="fullWidth"
          sx={{
            minHeight: 42,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 42, fontSize: 12.5, fontWeight: 700 },
          }}
        >
          <Tab
            value="attention"
            label={
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <span>نیازمند پیگیری</span>
                {badge > 0 && (
                  <Chip
                    size="small"
                    label={faNum(badge)}
                    color="warning"
                    sx={{ height: 18, fontSize: 10, fontWeight: 800, '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Stack>
            }
          />
          <Tab value="mine" label="آخرین اعلان‌ها" />
        </Tabs>

        {/* ── Body ── */}
        <Box sx={{ maxHeight: 430, overflow: 'auto', p: 1 }}>
          {tab === 'attention' && (
            <>
              {summaryLoading && dashboardItems.length === 0 && (
                <Stack spacing={1}>
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} variant="rounded" height={58} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              )}

              {!summaryLoading && dashboardItems.length === 0 && (
                <EmptyState
                  icon={<NotificationsIcon sx={{ fontSize: 34 }} />}
                  title="موردی برای پیگیری نیست"
                  hint="بار، پیشنهاد، پشتیبانی یا نظری در انتظار اقدام شما نیست."
                />
              )}

              {dashboardItems.map((item) => {
                const meta = getDashboardKindMeta(item.kind);
                return (
                  <Box
                    key={`${item.kind}-${item.id}`}
                    onClick={() => openItem(item.href)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') openItem(item.href);
                    }}
                    sx={{
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'center',
                      p: 1.1,
                      mb: 0.5,
                      borderRadius: 2.2,
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(meta.color, 0.08),
                        borderColor: alpha(meta.color, 0.22),
                      },
                    }}
                  >
                    <IconTile icon={meta.icon} color={meta.color} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {item.body}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ flexShrink: 0, fontSize: 10.5, whiteSpace: 'nowrap' }}
                    >
                      {relativeTime(item.at)}
                    </Typography>
                    <ChevronLeftIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                  </Box>
                );
              })}
            </>
          )}

          {tab === 'mine' && (
            <>
              {alertsLoading && myAlerts.length === 0 && (
                <Stack spacing={1}>
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              )}

              {!alertsLoading && myAlerts.length === 0 && (
                <EmptyState
                  icon={<NotificationsIcon sx={{ fontSize: 34 }} />}
                  title="اعلانی ندارید"
                  hint="در حال حاضر هیچ اعلانی در سامانه ثبت نشده است."
                />
              )}

              {myAlerts.map((alert) => {
                const meta = getTypeCodeMeta(alert.typeCode);
                const target = getTargetAppMeta(alert.targetApp);
                const status = getStatusMeta(alert.status);
                const isRead = Boolean(alert.readAtUtc);
                const isExpanded = expandedId === alert.id;
                const payload = parsePayload(alert.payload);

                return (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 1.1,
                      mb: 0.75,
                      borderRadius: 2.2,
                      border: '1px solid',
                      borderColor: isRead ? 'divider' : alpha(theme.palette.primary.main, 0.28),
                      bgcolor: isRead
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: alpha(meta.color, 0.45) },
                    }}
                  >
                    <Box
                      onClick={() => handleAlertClick(alert.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAlertClick(alert.id);
                      }}
                      sx={{ display: 'flex', gap: 1.1, alignItems: 'flex-start' }}
                    >
                      <IconTile icon={meta.icon} color={meta.color} size={36} />

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: isRead ? 600 : 800 }} noWrap>
                            {alert.title || meta.title}
                          </Typography>
                          {!isRead && (
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                          {alert.message || '—'}
                        </Typography>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={status.label}
                            sx={{
                              height: 19,
                              fontSize: 10,
                              fontWeight: 700,
                              color: status.color,
                              bgcolor: alpha(status.color, 0.12),
                            }}
                          />
                          <Chip
                            size="small"
                            label={target.label}
                            variant="outlined"
                            sx={{
                              height: 19,
                              fontSize: 10,
                              fontWeight: 600,
                              borderColor: alpha(target.color, 0.4),
                              color: target.color,
                            }}
                          />
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5 }}>
                            {relativeTime(alert.createdDate)}
                          </Typography>
                        </Stack>
                      </Box>

                      <ExpandMoreIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.disabled',
                          flexShrink: 0,
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </Box>

                    <Collapse in={isExpanded} unmountOnExit>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                        <MetaRow label="کد رویداد" value={alert.typeCode || '—'} ltr />
                        <MetaRow label="اپلیکیشن هدف" value={target.label} />
                        <MetaRow label="زمان ایجاد" value={formatFaDateTime(alert.createdDate)} />
                        <MetaRow
                          label="وضعیت خوانده‌شدن"
                          value={isRead ? formatFaDateTime(alert.readAtUtc) : 'خوانده‌نشده'}
                        />
                      </Box>
                      {payload && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            جزئیات رویداد
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75, mt: 0.5 }}>
                            {Object.entries(payload).map(([key, value]) => (
                              <MetaRow key={key} label={getPayloadLabel(key)} value={value} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Collapse>
                  </Box>
                );
              })}
            </>
          )}
        </Box>

        <Divider />

        {/* ── Footer ── */}
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 1 }}
          spacing={1}
        >
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
            {tab === 'mine' ? `${faNum(myAlertsTotal)} اعلان` : `${faNum(badge)} مورد باز`}
          </Typography>
          <Button
            size="small"
            color="primary"
            endIcon={<ChevronLeftIcon />}
            onClick={goToAll}
            sx={{ borderRadius: 2, fontSize: 12, fontWeight: 700 }}
          >
            مشاهده‌ی همه
          </Button>
        </Stack>
      </Popover>
    </>
  );
}

function MetaRow({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        dir={ltr ? 'ltr' : undefined}
        sx={{ display: 'block', fontWeight: 600, fontSize: 11.5, textAlign: ltr ? 'right' : 'inherit' }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
      <Box
        sx={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          mx: 'auto',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: alpha(theme.palette.primary.main, 0.55),
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700 }} color="text.secondary">
        {title}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
        {hint}
      </Typography>
    </Box>
  );
}
