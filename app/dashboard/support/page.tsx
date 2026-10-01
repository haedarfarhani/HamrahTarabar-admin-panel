'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  SupportAgent as SupportIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  AssignmentInd as AssignIcon,
  CheckCircle as InReviewIcon,
  HourglassEmpty as WaitingIcon,
  Lock as CloseIcon,
  LockOpen as ReopenIcon,
  Forum as EmptyChatIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import {
  assignSupportToMe,
  getSupportMessages,
  getSupportQueue,
  markSupportRead,
  sendSupportMessage,
  supportWebSocketUrl,
  updateSupportStatus,
  type SupportConversation,
  type SupportMessage,
} from '@/app/lib/api';

/* ───────── Helpers ───────── */

const formatWhen = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatClock = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatFullDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full', timeStyle: 'short' }).format(date);
};

const beep = () => {
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.12);
    window.setTimeout(() => audio.close(), 300);
  } catch {
    // Playback can be blocked until the admin interacts with the page.
  }
};

const STATUS_META: Record<number, { color: string }> = {
  1: { color: '#2196f3' },
  2: { color: '#ff9800' },
  3: { color: '#9c27b0' },
  4: { color: '#78909c' },
};

const statusColor = (status: number) => STATUS_META[status]?.color || '#2196f3';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'باز و در حال بررسی' },
  { value: '1', label: 'باز' },
  { value: '2', label: 'در حال بررسی' },
  { value: '3', label: 'در انتظار' },
  { value: '4', label: 'بسته' },
];

/* ───────── Page ───────── */

export default function SupportPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [items, setItems] = useState<SupportConversation[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [userKind, setUserKind] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [alerted, setAlerted] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const socketRef = useRef<WebSocket | null>(null);
  const selectedRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const unreadTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.unreadCount || 0), 0),
    [items]
  );

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const response = await getSupportQueue({
        status: status ? Number(status) : undefined,
        userKind: userKind ? Number(userKind) : undefined,
        search: search.trim() || undefined,
        from: from ? `${from}T00:00:00Z` : undefined,
        to: to ? `${to}T23:59:59Z` : undefined,
      });
      if (response.success) setItems(response.data?.items ?? []);
      else setQueueError(response.message || 'خطا در دریافت صف پشتیبانی');
    } catch {
      setQueueError('خطا در دریافت صف پشتیبانی');
    } finally {
      setQueueLoading(false);
    }
  }, [from, search, status, to, userKind]);

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setTyping(false);
    setMessagesLoading(true);
    try {
      const response = await getSupportMessages(id);
      if (response.success) setMessages(response.data ?? []);
      await markSupportRead(id).catch(() => undefined);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)));
    } catch {
      setSnackbar({ open: true, message: 'خطا در دریافت پیام‌ها', severity: 'error' });
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadQueue().catch(() => setItems([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadQueue]);

  useEffect(() => {
    let stopped = false;
    let retry: number | undefined;
    const connect = () => {
      const url = supportWebSocketUrl();
      if (!url || stopped) return;
      const socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        let data: { type?: string; payload?: { conversation?: SupportConversation; message?: SupportMessage }; conversationId?: string; isTyping?: boolean; fromAdmin?: boolean };
        try {
          data = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (data.type === 'typing') {
          if (data.conversationId === selectedRef.current && !data.fromAdmin) setTyping(Boolean(data.isTyping));
          return;
        }
        const conversation = data.payload?.conversation as SupportConversation | undefined;
        const message = data.payload?.message as SupportMessage | undefined;
        if (conversation) {
          setItems((current) => {
            const next = current.filter((item) => item.id !== conversation.id);
            return [conversation, ...next];
          });
        }
        if (data.type === 'message' && message) {
          if (message.senderKind === 1) {
            beep();
            setAlerted(true);
          }
          if (message.conversationId === selectedRef.current) {
            setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
            markSupportRead(message.conversationId).catch(() => undefined);
          }
        }
      };
      socket.onclose = () => {
        if (!stopped) retry = window.setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      stopped = true;
      if (retry) window.clearTimeout(retry);
      socketRef.current?.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing, selectedId]);

  const send = async () => {
    const text = draft.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    setDraft('');
    try {
      const response = await sendSupportMessage(selectedId, text);
      if (response.success && response.data) {
        const message = response.data;
        setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      } else {
        setDraft(text);
        setSnackbar({ open: true, message: response.message || 'ارسال پیام ناموفق بود', severity: 'error' });
      }
    } catch {
      setDraft(text);
      setSnackbar({ open: true, message: 'ارسال پیام ناموفق بود', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (next: number) => {
    if (!selectedId) return;
    setBusyAction(`status-${next}`);
    try {
      const response = await updateSupportStatus(selectedId, next);
      if (response.success && response.data) {
        const updated = response.data;
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSnackbar({ open: true, message: `وضعیت به «${updated.statusLabel}» تغییر کرد`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.message || 'تغییر وضعیت ناموفق بود', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'تغییر وضعیت ناموفق بود', severity: 'error' });
    } finally {
      setBusyAction(null);
    }
  };

  const assignToMe = async () => {
    if (!selectedId) return;
    setBusyAction('assign');
    try {
      const response = await assignSupportToMe(selectedId);
      if (response.success && response.data) {
        const updated = response.data;
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSnackbar({ open: true, message: 'گفتگو به شما اختصاص یافت', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.message || 'اختصاص گفتگو ناموفق بود', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'اختصاص گفتگو ناموفق بود', severity: 'error' });
    } finally {
      setBusyAction(null);
    }
  };

  const clearFilters = () => {
    setStatus('');
    setUserKind('');
    setSearch('');
    setFrom('');
    setTo('');
  };

  const hasActiveFilter = Boolean(status || userKind || search.trim() || from || to);
  const isClosed = selected?.status === 4;
  const headerColor = selected ? statusColor(selected.status) : theme.palette.primary.main;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
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
            <SupportIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              پشتیبانی
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {queueLoading ? 'در حال بارگذاری صف...' : `${items.length.toLocaleString('fa-IR')} گفتگو در این نما`}
              {unreadTotal > 0 && ` · ${unreadTotal.toLocaleString('fa-IR')} پیام خوانده‌نشده`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {alerted && (
            <Chip
              icon={<SupportIcon sx={{ fontSize: 16 }} />}
              label="پیام جدید رسید"
              color="warning"
              size="small"
              onDelete={() => setAlerted(false)}
              sx={{ fontWeight: 700 }}
            />
          )}
          <Tooltip title="بروزرسانی">
            <IconButton onClick={() => loadQueue()} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Toolbar ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس نام، شماره یا متن پیام..."
            sx={{ flex: 1, minWidth: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="نوع کاربر"
            value={userKind}
            onChange={(event) => setUserKind(event.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">همه</MenuItem>
            <MenuItem value="1">راننده</MenuItem>
            <MenuItem value="2">صاحب بار</MenuItem>
          </TextField>
          <Button
            size="small"
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters((prev) => !prev)}
            sx={{ borderRadius: 2 }}
          >
            تاریخ
          </Button>
          {hasActiveFilter && (
            <Button size="small" color="inherit" onClick={clearFilters} sx={{ borderRadius: 2 }}>
              پاک کردن فیلترها
            </Button>
          )}
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
            <TextField
              size="small"
              type="date"
              label="از تاریخ"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: { startAdornment: <InputAdornment position="start"><CalendarIcon color="action" fontSize="small" /></InputAdornment> },
              }}
            />
            <TextField
              size="small"
              type="date"
              label="تا تاریخ"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: { startAdornment: <InputAdornment position="start"><CalendarIcon color="action" fontSize="small" /></InputAdornment> },
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            const color = tab.value ? statusColor(Number(tab.value)) : theme.palette.primary.main;
            return (
              <Chip
                key={tab.value || 'default'}
                label={tab.label}
                size="small"
                onClick={() => setStatus(tab.value)}
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: active ? alpha(color, 0.16) : isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04),
                  color: active ? color : 'text.secondary',
                  border: active ? `1px solid ${alpha(color, 0.5)}` : '1px solid transparent',
                  '&:hover': { bgcolor: alpha(color, 0.12) },
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {queueError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setQueueError(null)}>
          {queueError}
        </Alert>
      )}

      {/* ── Main ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '330px minmax(0, 1fr) 270px' }, gap: 2, alignItems: 'start' }}>
        {/* Queue */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: { md: 640, xs: 420 }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>صف گفتگوها</Typography>
            <Chip size="small" label={items.length.toLocaleString('fa-IR')} sx={{ fontWeight: 700 }} />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {queueLoading && items.length === 0 && (
              <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 2 }} />
                ))}
              </Box>
            )}

            {!queueLoading && items.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <ForumIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
                  گفتگویی یافت نشد
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  فیلترها را تغییر دهید یا کمی صبر کنید
                </Typography>
                {hasActiveFilter && (
                  <Button size="small" onClick={clearFilters} sx={{ mt: 1.5, borderRadius: 2 }}>
                    پاک کردن فیلترها
                  </Button>
                )}
              </Box>
            )}

            {items.map((item) => {
              const active = item.id === selectedId;
              const color = statusColor(item.status);
              const initial = (item.userFullName || '؟').trim().charAt(0);
              return (
                <Box
                  key={item.id}
                  onClick={() => openConversation(item.id)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: active ? alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08) : 'transparent',
                    borderRight: `4px solid ${active ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'background-color .15s ease',
                    '&:hover': { bgcolor: active ? undefined : isDark ? alpha('#fff', 0.05) : alpha('#000', 0.03) },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      fontWeight: 800,
                      bgcolor: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {item.userFullName}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                        {formatClock(item.lastMessageAt || item.createdDate)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, mb: 0.5 }}>
                      <Chip
                        label={item.statusLabel}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          bgcolor: alpha(color, 0.15),
                          color: color,
                        }}
                      />
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ flex: 1, minWidth: 0 }}>
                        {item.userKindLabel}
                        {item.assignedAdminName ? ` · ${item.assignedAdminName}` : ''}
                      </Typography>
                      {item.unreadCount > 0 && (
                        <Chip
                          size="small"
                          color="primary"
                          label={item.unreadCount.toLocaleString('fa-IR')}
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color={item.unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                      sx={{
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontWeight: item.unreadCount > 0 ? 700 : 400,
                      }}
                    >
                      {item.lastMessage || 'بدون پیام'}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Chat */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: { md: 640, xs: 520 }, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mb: 1,
                }}
              >
                <EmptyChatIcon sx={{ fontSize: 42, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>گفتگویی انتخاب نشده</Typography>
              <Typography variant="body2" color="text.secondary">
                از ستون کناری یک گفتگو را باز کنید تا پیام‌ها و جزئیات کاربر را ببینید.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Chat header */}
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(headerColor, isDark ? 0.14 : 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                <Avatar sx={{ width: 38, height: 38, fontWeight: 800, bgcolor: headerColor, color: '#fff' }}>
                  {(selected.userFullName || '؟').charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }} noWrap>
                    {selected.userFullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.userKindLabel}
                    {selected.userPhone ? ` · ${selected.userPhone}` : ''}
                  </Typography>
                </Box>
                <Chip
                  label={selected.statusLabel}
                  size="small"
                  sx={{ ml: 'auto', fontWeight: 800, bgcolor: alpha(headerColor, 0.18), color: headerColor }}
                />
                {selected.assignedAdminName && (
                  <Chip size="small" variant="outlined" icon={<AssignIcon sx={{ fontSize: 15 }} />} label={selected.assignedAdminName} sx={{ fontWeight: 600 }} />
                )}
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, bgcolor: isDark ? alpha('#000', 0.15) : alpha('#000', 0.015) }}>
                {messagesLoading && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 3, width: i % 2 ? '60%' : '45%', alignSelf: i % 2 ? 'flex-start' : 'flex-end' }} />
                    ))}
                  </Box>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary">هنوز پیامی در این گفتگو نیست.</Typography>
                    <Typography variant="caption" color="text.disabled">اولین پیام را بنویسید.</Typography>
                  </Box>
                )}

                {messages.map((message) => {
                  const mine = message.senderKind === 2;
                  return (
                    <Box key={message.id} sx={{ alignSelf: mine ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                      {!mine && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25, pr: 0.5 }}>
                          {message.senderName}
                        </Typography>
                      )}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.25,
                          px: 1.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: mine ? 'transparent' : 'divider',
                          bgcolor: mine ? 'primary.main' : isDark ? alpha('#fff', 0.07) : '#fff',
                          color: mine ? 'primary.contrastText' : 'text.primary',
                          boxShadow: mine ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
                        }}
                      >
                        <Typography variant="body2" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.text}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.65rem' }}>
                            {formatClock(message.sentAt)}
                          </Typography>
                          {mine &&
                            (message.isRead
                              ? <DoneAllIcon sx={{ fontSize: 15, opacity: 0.9 }} />
                              : <DoneIcon sx={{ fontSize: 15, opacity: 0.7 }} />)}
                        </Box>
                      </Paper>
                    </Box>
                  );
                })}

                {typing && (
                  <Box sx={{ alignSelf: 'flex-end', display: 'flex', gap: 0.5, alignItems: 'center', px: 1 }}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'text.disabled',
                          animation: `supportPulse 1s ${i * 0.15}s infinite ease-in-out`,
                          '@keyframes supportPulse': {
                            '0%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                            '50%': { transform: 'translateY(-4px)', opacity: 1 },
                          },
                        }}
                      />
                    ))}
                    <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
                      کاربر در حال نوشتن...
                    </Typography>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>

              {/* Composer */}
              {isClosed ? (
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                  <Alert severity="info" sx={{ borderRadius: 2, py: 0.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2">این گفتگو بسته شده است.</Typography>
                      <Button size="small" variant="outlined" startIcon={<ReopenIcon />} onClick={() => changeStatus(1)} disabled={busyAction !== null} sx={{ borderRadius: 2 }}>
                        بازگشایی گفتگو
                      </Button>
                    </Box>
                  </Alert>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: '1px solid', borderColor: 'divider', alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={5}
                    size="small"
                    placeholder="پاسخ خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)"
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (selectedId && socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(JSON.stringify({ type: 'typing', conversationId: selectedId, isTyping: event.target.value.trim().length > 0 }));
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, alignItems: 'flex-end' } }}
                  />
                  <Tooltip title="ارسال">
                    <span>
                      <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        disabled={!draft.trim() || sending || !selected}
                        onClick={send}
                        sx={{ borderRadius: 3, px: 3, height: 40, minWidth: 108, fontWeight: 800, boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.35)}` }}
                      >
                        ارسال
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </Paper>

        {/* Details */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: { md: 640, xs: 'auto' }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>جزئیات گفتگو</Typography>
          </Box>

          {!selected ? (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">یک گفتگو را انتخاب کنید.</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    mb: 1,
                    bgcolor: `linear-gradient(135deg, ${headerColor}, ${alpha(headerColor, 0.65)})`,
                    color: '#fff',
                    boxShadow: `0 6px 18px ${alpha(headerColor, 0.4)}`,
                  }}
                >
                  {(selected.userFullName || '؟').charAt(0)}
                </Avatar>
                <Typography sx={{ fontWeight: 800 }}>{selected.userFullName}</Typography>
                <Chip label={selected.statusLabel} size="small" sx={{ mt: 0.75, fontWeight: 700, bgcolor: alpha(headerColor, 0.15), color: headerColor }} />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <DetailRow icon={<PersonIcon />} label="نوع کاربر" value={selected.userKindLabel} />
              <DetailRow
                icon={<PhoneIcon />}
                label="شماره تماس"
                value={selected.userPhone || '—'}
                href={selected.userPhone ? `tel:${selected.userPhone}` : undefined}
              />
              <DetailRow icon={<AssignIcon />} label="مسئول پیگیری" value={selected.assignedAdminName || 'اختصاص داده نشده'} />
              <DetailRow icon={<CalendarIcon />} label="تاریخ ایجاد" value={formatFullDate(selected.createdDate)} />
              <DetailRow icon={<ForumIcon />} label="آخرین پیام" value={formatWhen(selected.lastMessageAt)} />

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                عملیات
              </Typography>
              <Button fullWidth variant="outlined" startIcon={<AssignIcon />} sx={{ mb: 1, borderRadius: 2 }} onClick={assignToMe} disabled={busyAction !== null}>
                {busyAction === 'assign' ? 'در حال اختصاص...' : 'اختصاص به من'}
              </Button>
              <ActionButton
                color={STATUS_META[2].color}
                icon={<InReviewIcon />}
                label="در حال بررسی"
                busy={busyAction === 'status-2'}
                disabled={busyAction !== null || selected.status === 2}
                onClick={() => changeStatus(2)}
              />
              <ActionButton
                color={STATUS_META[3].color}
                icon={<WaitingIcon />}
                label="در انتظار پاسخ کاربر"
                busy={busyAction === 'status-3'}
                disabled={busyAction !== null || selected.status === 3}
                onClick={() => changeStatus(3)}
              />
              {isClosed ? (
                <ActionButton
                  color={STATUS_META[1].color}
                  icon={<ReopenIcon />}
                  label="بازگشایی گفتگو"
                  busy={busyAction === 'status-1'}
                  disabled={busyAction !== null}
                  onClick={() => changeStatus(1)}
                />
              ) : (
                <ActionButton
                  color={STATUS_META[4].color}
                  icon={<CloseIcon />}
                  label="بستن گفتگو"
                  busy={busyAction === 'status-4'}
                  disabled={busyAction !== null}
                  onClick={() => changeStatus(4)}
                />
              )}
            </Box>
          )}
        </Paper>
      </Box>

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

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'text.secondary', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        {href ? (
          <Typography component="a" href={href} variant="body2" sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, direction: 'ltr', textAlign: 'right', display: 'block' }}>
            {value}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
        )}
      </Box>
    </Box>
  );
}

function ActionButton({
  color,
  icon,
  label,
  onClick,
  disabled,
  busy,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={{
        mb: 1,
        borderRadius: 2,
        justifyContent: 'flex-start',
        fontWeight: 700,
        color: color,
        borderColor: alpha(color, 0.45),
        '&:hover': { borderColor: color, bgcolor: alpha(color, 0.1) },
      }}
    >
      {busy ? 'در حال پردازش...' : label}
    </Button>
  );
}
