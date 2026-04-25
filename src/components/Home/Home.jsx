import { useState, useEffect, useMemo, useRef } from 'react';
import { AVATAR_OPTIONS } from '../../lib/avatars';
import {
  Box, Typography, Card, IconButton, Switch, LinearProgress,
  Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Divider, Avatar, Menu, MenuItem,
} from '../../lib/ui-lite';
import TimePicker from '../common/TimePicker';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import SnoozeIcon from '@mui/icons-material/Snooze';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlarmIcon from '@mui/icons-material/Alarm';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { isNative, openNativeCreateAlarm, openRingtonePicker, previewSound as previewNativeSound, setNativeBottomNavVisible, showNativeStats, hideNativeStats, showNativeAlarms, hideNativeAlarms } from '../../lib/nativeAlarms';
import { ALARM_SOUNDS, previewAlarmSound } from '../../lib/sounds';

const PULSE_COLORS = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F' };
const PULSE_LABELS = { gentle: 'Gentle', moderate: 'Moderate', intense: 'Intense' };
const DAY_LABELS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const NAV_ITEMS = [
  { label: 'Alarms',  Icon: HomeIcon },
  { label: 'Stats',   Icon: BarChartIcon },
  { label: 'Profile', Icon: PersonIcon },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

function getNextFire(alarm) {
  if (!alarm.active) return null;
  const [h, m] = alarm.time.split(':').map(Number);
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(h, m, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  if (alarm.days?.length > 0) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(candidate);
      d.setDate(d.getDate() + i);
      if (alarm.days.includes(d.getDay())) return d;
    }
    return null;
  }
  return candidate;
}

function formatCountdown(ms) {
  if (ms <= 0) return '0m';
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return h === 0 ? `${mins}m` : `${h}h ${mins}m`;
}

function getGreeting(hour) {
  if (hour < 5)  return "G'night";
  if (hour < 12) return "G'day";
  if (hour < 17) return 'Arvo';
  if (hour < 21) return "G'evening";
  return "G'night";
}

function buildTestAlarm(alarm) {
  const pulse = alarm?.pulse ?? {};
  const intensity = pulse.intensity || 'moderate';
  const games = Array.isArray(pulse.games) && pulse.games.length > 0 ? pulse.games : ['math'];
  const sound = alarm?.sound || pulse.sound || 'gentle_chime';

  return {
    ...alarm,
    sound,
    pulse: {
      ...pulse,
      intensity,
      games,
      sound,
    },
  };
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState(0);
  const [alarmOverlayOpen, setAlarmOverlayOpen] = useState(false);
  const nativeStatsPayloadRef = useRef('');
  const nativeBottomNavVisibleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;
    nativeBottomNavVisibleRef.current = true;
    void setNativeBottomNavVisible(true);
    function handleNavTab(e) {
      let detail = e.detail;
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail);
        } catch {
          detail = {};
        }
      }
      const nextTab = detail?.tab ?? 0;
      setTab(nextTab);
    }
    document.addEventListener('navTabChanged', handleNavTab);
    return () => {
      document.removeEventListener('navTabChanged', handleNavTab);
      void setNativeBottomNavVisible(false);
    };
  }, []);

  useEffect(() => {
    if (!isNative) return;
    const visible = !alarmOverlayOpen;
    if (nativeBottomNavVisibleRef.current === visible) return;
    nativeBottomNavVisibleRef.current = visible;
    void setNativeBottomNavVisible(visible);
  }, [alarmOverlayOpen]);

  const { user, alarms, XP_PER_LEVEL, wakeStats } = useApp();
  const nativeStatsPayload = useMemo(() => {
    if (!isNative || tab !== 1) return null;
    return {
      level:             user?.level ?? 1,
      xp:                user?.xp ?? 0,
      xpPerLevel:        XP_PER_LEVEL ?? 100,
      streak:            user?.streak ?? 0,
      demerits:          user?.demerits ?? 0,
      alarmsCount:       alarms?.length ?? 0,
      activeAlarmsCount: alarms?.filter(a => a.active).length ?? 0,
      successCount:      wakeStats?.success ?? 0,
      failedCount:       wakeStats?.failed ?? 0,
    };
  }, [
    tab,
    user?.level,
    user?.xp,
    user?.streak,
    user?.demerits,
    alarms,
    wakeStats?.success,
    wakeStats?.failed,
    XP_PER_LEVEL,
  ]);

  useEffect(() => {
    if (!isNative) return;
    if (tab !== 1 || !nativeStatsPayload) {
      if (nativeStatsPayloadRef.current === 'hidden') return;
      nativeStatsPayloadRef.current = 'hidden';
      void hideNativeStats();
      return;
    }

    const serialized = JSON.stringify(nativeStatsPayload);
    if (nativeStatsPayloadRef.current === serialized) return;
    nativeStatsPayloadRef.current = serialized;
    void showNativeStats(nativeStatsPayload);
  }, [tab, nativeStatsPayload]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', pb: isNative ? 13 : 9 }}>
        <div style={{ display: tab === 0 ? 'block' : 'none' }}>
          <AlarmsTab active={tab === 0} onNavigate={navigate} onOverlayChange={setAlarmOverlayOpen} />
        </div>
        <div style={{ display: tab === 1 ? 'block' : 'none' }}>
          <StatsTab />
        </div>
        <div style={{ display: tab === 2 ? 'block' : 'none' }}>
          <ProfileTab />
        </div>
      </Box>

      {/* Web nav — hidden on native (native Compose nav is used instead) */}
      {!isNative && !alarmOverlayOpen && (
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: 'rgba(10,10,22,0.93)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        display: 'flex',
        pb: 'max(env(safe-area-inset-bottom), 4px)',
      }}>
        <Box sx={{
          position: 'absolute',
          bottom: 10,
          left: `calc(${tab} * 33.333% + 16.666% - 22px)`,
          width: 44, height: 3, borderRadius: 2,
          background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
          boxShadow: '0 0 10px rgba(255,107,53,0.6)',
          transition: 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
        }} />
        {NAV_ITEMS.map((item, i) => (
          <Box
            key={i}
            onClick={() => setTab(i)}
            sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pt: 1.5, pb: 0.75, cursor: 'pointer',
              gap: 0.3, userSelect: 'none',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <item.Icon sx={{
              fontSize: '1.45rem',
              color: tab === i ? '#FF6B35' : 'rgba(255,255,255,0.28)',
              transition: 'color 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              transform: tab === i ? 'scale(1.1)' : 'scale(1)',
            }} />
            <Typography sx={{
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em',
              color: tab === i ? '#FF6B35' : 'rgba(255,255,255,0.28)',
              transition: 'color 0.2s',
            }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
      )}
    </Box>
  );
}

// ─── Alarms Tab ───────────────────────────────────────────────────────────────

function AlarmsTab({ active = true, onNavigate, onOverlayChange }) {
  const {
    user,
    alarms,
    toggleAlarm,
    addAlarm,
    deleteAlarm,
    editAlarm,
    xpProgress,
    XP_PER_LEVEL,
    triggerAlarm,
    nativeAlarmStatus,
    requestNativeAlarmPermissions,
    refreshNativeAlarmStatus,
  } = useApp();
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [now, setNow]                   = useState(new Date());
  const [nativeEditorOpen, setNativeEditorOpen] = useState(false);
  const nativePayloadRef                = useRef('');

  async function handleCreateAlarm() {
    if (isNative) {
      setNativeEditorOpen(true);
      nativePayloadRef.current = '';
      try {
        const alarm = await openNativeCreateAlarm({ defaultTime: user?.wakeTime });
        if (alarm?.time) void addAlarm(alarm);
      } finally {
        setNativeEditorOpen(false);
      }
      return;
    }

    onNavigate('/create-alarm');
  }

  async function handleEditAlarm(alarm) {
    if (isNative) {
      setNativeEditorOpen(true);
      nativePayloadRef.current = '';
      try {
        const updates = await openNativeCreateAlarm({ alarm });
        if (updates?.time) void editAlarm(alarm.id, updates);
      } finally {
        setNativeEditorOpen(false);
      }
      return;
    }

    setEditTarget(alarm);
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    onOverlayChange?.(Boolean(editTarget));
    return () => onOverlayChange?.(false);
  }, [editTarget, onOverlayChange]);

  const xpInLevel = user.xp % XP_PER_LEVEL;

  const sortedAlarms = useMemo(() => (
    [...alarms].sort((a, b) => {
      const aNext = getNextFire(a);
      const bNext = getNextFire(b);
      if (aNext && bNext) return aNext - bNext;
      if (aNext) return -1;
      if (bNext) return 1;
      return a.time.localeCompare(b.time);
    })
  ), [alarms]);

  const nextAlarm    = sortedAlarms.find(a => a.active && getNextFire(a));
  const msUntilNext  = nextAlarm ? getNextFire(nextAlarm) - now : null;
  const greeting     = getGreeting(now.getHours());
  const gameLabel = {
    math: 'Math Blitz',
    memory: 'Memory Match',
    reaction: 'Reaction Rush',
  }[user.favoriteGame] || 'Wake Challenge';
  const todayFocusLabel = nextAlarm
    ? (nextAlarm.label || user.wakeGoal || 'Tomorrow focus')
    : (user.wakeGoal || 'Build tomorrow tonight');
  const heroTitle = nextAlarm ? formatTime(nextAlarm.time) : 'No alarm set';
  /* eslint-disable no-unused-vars */
  const heroSubtitleText = nextAlarm ? "Tomorrow's next alarm" : 'Set your next wake-up';
  const heroMetaText = nextAlarm
    ? `${gameLabel} - ${nextAlarm.days?.length ? `${nextAlarm.days.length} day routine` : 'One-time alarm'}`
    : `${gameLabel} - ${user.streak > 0 ? `${user.streak} day streak` : 'Start your streak'}`;
  const heroSubtitle = nextAlarm ? 'Tomorrow’s next alarm' : 'Set your next wake-up';
  const heroMeta = nextAlarm
    ? `${gameLabel} · ${nextAlarm.days?.length ? `${nextAlarm.days.length} day routine` : 'One-time alarm'}`
    : `${gameLabel} · ${user.streak > 0 ? `${user.streak} day streak` : 'Start your streak'}`;

  /* eslint-enable no-unused-vars */
  const nativePayload = useMemo(() => {
    if (!isNative) return null;
    return {
      userName: user.name || 'Mate',
      defaultWakeTime: user.wakeTime || '07:00',
      wakeGoal: user.wakeGoal || '',
      favoriteGame: user.favoriteGame || 'math',
      streak: user.streak || 0,
      xp: user.xp || 0,
      xpPerLevel: XP_PER_LEVEL,
      xpProgress,
      demerits: user.demerits || 0,
      exactAlarmReady: Boolean(nativeAlarmStatus?.exactAlarm),
      alarms: sortedAlarms,
    };
  }, [
    nativeAlarmStatus?.exactAlarm,
    sortedAlarms,
    user.name,
    user.wakeTime,
    user.wakeGoal,
    user.favoriteGame,
    user.streak,
    user.xp,
    user.demerits,
    XP_PER_LEVEL,
    xpProgress,
  ]);

  useEffect(() => {
    if (!isNative || !active || !nativePayload) {
      if (isNative) {
        nativePayloadRef.current = '';
        void hideNativeAlarms();
      }
      return undefined;
    }

    let cancelled = false;
    const serialized = JSON.stringify(nativePayload);

    async function syncNative() {
      if (nativePayloadRef.current === serialized) return;
      nativePayloadRef.current = serialized;
      await showNativeAlarms(nativePayload);
    }

    void syncNative();

    return () => {
      cancelled = true;
    };
  }, [active, nativePayload]);

  useEffect(() => {
    if (!isNative) return undefined;
    return () => {
      nativePayloadRef.current = '';
      void hideNativeAlarms();
    };
  }, []);

  useEffect(() => {
    if (!isNative || !active || nativeEditorOpen) return undefined;

    function handleNativeAlarmEditorResult(e) {
      let detail = e.detail;
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail);
        } catch {
          detail = {};
        }
      }

      const action = detail?.action;
      const id = detail?.id;
      const alarm = detail?.alarm;
      if (!alarm?.time) return;

      if (action === 'edit' && id) {
        void editAlarm(id, alarm);
        return;
      }
      void addAlarm(alarm);
    }

    async function handleNativeAlarmAction(e) {
      let detail = e.detail;
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail);
        } catch {
          detail = {};
        }
      }

      const action = detail?.action;
      const id = detail?.id;
      const alarm = id ? alarms.find(entry => String(entry.id) === String(id)) : null;

      if (action === 'create') {
        await handleCreateAlarm();
      } else if (action === 'edit' && alarm) {
        await handleEditAlarm(alarm);
      } else if (action === 'toggle' && alarm) {
        toggleAlarm(alarm.id);
      } else if (action === 'delete' && alarm) {
        deleteAlarm(alarm.id);
      } else if (action === 'test' && alarm) {
        triggerAlarm(buildTestAlarm(alarm));
      } else if (action === 'settings') {
        requestNativeAlarmPermissions?.();
      } else if (action === 'refresh') {
        refreshNativeAlarmStatus?.();
      }
    }

    document.addEventListener('nativeAlarmEditorResult', handleNativeAlarmEditorResult);
    document.addEventListener('nativeAlarmAction', handleNativeAlarmAction);
    return () => {
      document.removeEventListener('nativeAlarmEditorResult', handleNativeAlarmEditorResult);
      document.removeEventListener('nativeAlarmAction', handleNativeAlarmAction);
    };
  }, [
    addAlarm,
    alarms,
    deleteAlarm,
    editAlarm,
    active,
    nativeEditorOpen,
    refreshNativeAlarmStatus,
    requestNativeAlarmPermissions,
    toggleAlarm,
    triggerAlarm,
  ]);

  if (isNative && active) return null;

  return (
    <>
      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(170deg, #16082E 0%, #14142A 55%, #0D0D1A 100%)',
        px: 2.5, pt: 5.5, pb: 3,
        borderBottom: '1px solid rgba(255,107,53,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <Box sx={{
          position: 'absolute', width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 70%)',
          top: -140, right: -90, filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'homeOrb 9s ease-in-out infinite',
          '@keyframes homeOrb': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } },
        }} />
        <Box sx={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,209,102,0.06) 0%, transparent 70%)',
          bottom: -50, left: -50, filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Brand + clock */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <WbSunnyIcon sx={{ color: 'primary.main', fontSize: 13, filter: 'drop-shadow(0 0 6px rgba(255,107,53,0.5))' }} />
            <Typography sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.14em', fontSize: '0.58rem' }}>
              MORNINMATE
            </Typography>
          </Box>
          <Box sx={{
            px: 1.25,
            py: 0.9,
            borderRadius: 2.5,
            bgcolor: 'rgba(20,20,36,0.96)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.9,
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#FFD166',
              boxShadow: '0 0 10px rgba(255,209,102,0.75)',
              animation: 'clockPulse 2.2s ease-in-out infinite',
              '@keyframes clockPulse': {
                '0%,100%': { opacity: 0.65, transform: 'scale(1)' },
                '50%': { opacity: 1, transform: 'scale(1.2)' },
              },
            }} />
            <Box sx={{ minWidth: 72 }}>
              <Typography sx={{
                fontWeight: 800,
                color: '#FFF5DF',
                fontSize: '1rem',
                lineHeight: 1,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: '"Fraunces", serif',
                textShadow: 'none',
              }}>
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography sx={{
                mt: 0.35,
                fontSize: '0.54rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.42)',
                textTransform: 'uppercase',
              }}>
                Local time
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          position: 'relative',
          p: 1.4,
          borderRadius: 3,
          bgcolor: 'rgba(15,15,28,0.78)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 14px 28px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          mb: 1,
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 3,
            background: 'linear-gradient(90deg, #FF6B35 0%, #FF9A6D 42%, rgba(255,255,255,0) 100%)',
            opacity: 0.9,
          }} />
          <Box sx={{
            position: 'absolute',
            top: -36,
            right: -18,
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.22) 0%, rgba(255,107,53,0.07) 46%, transparent 74%)',
            pointerEvents: 'none',
          }} />
          <Box sx={{
            position: 'absolute',
            inset: 1,
            borderRadius: 3.5,
            border: '1px solid rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }} />

          <Box sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1.25,
            alignItems: 'center',
          }}>
            <Box sx={{ minWidth: 0, flex: 1, py: 0.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55, mb: 0.45 }}>
                <Box sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#FF9A6D',
                  boxShadow: '0 0 12px rgba(255,107,53,0.45)',
                  flexShrink: 0,
                }} />
                <Typography sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.54)',
                }}>
                  {greeting}, {user.name}
                </Typography>
              </Box>
              <Typography sx={{
                fontFamily: '"Fraunces", serif',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.72rem' },
                lineHeight: 0.98,
                letterSpacing: '-0.04em',
                color: '#FFF5DF',
              }}>
                {heroTitle}
              </Typography>
              <Typography sx={{
                mt: 0.45,
                fontSize: '0.76rem',
                color: 'rgba(255,255,255,0.62)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {nextAlarm ? todayFocusLabel : heroSubtitleText}
              </Typography>
            </Box>

            {nextAlarm && (
              <Box sx={{
                flexShrink: 0,
                minWidth: 76,
                px: 0.9,
                py: 0.65,
                borderRadius: 2.2,
                bgcolor: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}>
                <Typography sx={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.52)',
                  mb: 0.1,
                }}>
                  Next
                </Typography>
                <Typography sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#FFB07B',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {heroSubtitleText}
                </Typography>
              </Box>
            )}
          </Box>

          {nextAlarm && msUntilNext != null && (
            <Box sx={{
              mt: 0.95,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.45,
              px: 0.82,
              py: 0.38,
              borderRadius: 999,
              bgcolor: 'rgba(6,214,160,0.08)',
              border: '1px solid rgba(6,214,160,0.16)',
            }}>
              <AlarmIcon sx={{ fontSize: 10, color: '#7CE6C6' }} />
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#7CE6C6', fontVariantNumeric: 'tabular-nums' }}>
                In {formatCountdown(msUntilNext)}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 0.95 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.45 }}>
              <Typography sx={{
                fontSize: '0.58rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.48)',
              }}>
                XP Progress
              </Typography>
              <Typography sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.62)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {xpInLevel}/{XP_PER_LEVEL}
              </Typography>
            </Box>

            <Box sx={{ position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={xpProgress * 100}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.07)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #FF6B35 0%, #FFD166 100%)',
                    boxShadow: '0 0 10px rgba(255,107,53,0.38)',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* XP section */}
        <Box sx={{
          display: 'none',
          p: 2, borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <EmojiEventsIcon sx={{ fontSize: 13, color: '#FFD166' }} />
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem' }}>
                Level {user.level} → {user.level + 1}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {nextAlarm && msUntilNext != null && (
                <Box sx={{
                  px: 1, py: 0.25, borderRadius: 1.5,
                  bgcolor: 'rgba(255,107,53,0.1)',
                  border: '1px solid rgba(255,107,53,0.18)',
                  display: 'flex', alignItems: 'center', gap: 0.5,
                }}>
                  <AlarmIcon sx={{ fontSize: 9, color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 800, color: '#FF6B35', fontSize: '0.58rem', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCountdown(msUntilNext)}
                  </Typography>
                </Box>
              )}
              <Typography sx={{ fontWeight: 800, color: '#FF6B35', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                {xpInLevel}
                <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.62rem', fontWeight: 500 }}>
                  /{XP_PER_LEVEL} XP
                </Box>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={xpProgress * 100}
              sx={{
                height: 8, borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.07)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, #FF6B35 0%, #FFD166 100%)',
                  boxShadow: '0 0 12px rgba(255,107,53,0.5)',
                },
              }}
            />
            {[0.25, 0.5, 0.75].map(pct => (
              <Box key={pct} sx={{
                position: 'absolute', top: '50%', left: `${pct * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 3, height: 3, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
                bgcolor: xpProgress >= pct ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
              }} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              {XP_PER_LEVEL - xpInLevel} XP to level up
            </Typography>
            {user.demerits > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <WarningAmberIcon sx={{ fontSize: 10, color: '#EF476F' }} />
                <Typography sx={{ color: '#EF476F', fontWeight: 700, fontSize: '0.6rem' }}>
                  {user.demerits} demerit{user.demerits !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Alarm list ── */}
      <Box sx={{ px: 2, pt: 2.5, pb: 16 }}>
        <AndroidReadinessCard
          status={nativeAlarmStatus}
          onFix={requestNativeAlarmPermissions}
          onRefresh={refreshNativeAlarmStatus}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.2px' }}>
            Your Alarms
          </Typography>
          <Box sx={{
            px: 1.25, py: 0.3, borderRadius: 1.5,
            bgcolor: 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.18)',
          }}>
            <Typography sx={{ color: '#FF6B35', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.04em' }}>
              {alarms.filter(a => a.active).length} active
            </Typography>
          </Box>
        </Box>

        {sortedAlarms.length === 0 ? (
          <EmptyState onAdd={handleCreateAlarm} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sortedAlarms.map((alarm, idx) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                isNext={idx === 0 && alarm.active}
                now={now}
                onToggle={() => toggleAlarm(alarm.id)}
                onDelete={()  => setDeleteTarget(alarm)}
                onEdit={()    => handleEditAlarm(alarm)}
                onTest={()    => triggerAlarm(buildTestAlarm(alarm))}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── FAB ── */}
      {!editTarget && !deleteTarget && (
        <Box sx={{
          position: 'fixed',
          right: 'max(16px, calc(env(safe-area-inset-right) + 16px))',
          bottom: 'calc(env(safe-area-inset-bottom) + 110px)',
          zIndex: 140,
        }}>
          <Box sx={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: '2px solid rgba(255,107,53,0.25)', pointerEvents: 'none',
            animation: 'fabRing 2.4s ease-out infinite',
            '@keyframes fabRing': { '0%': { transform: 'scale(1)', opacity: 0.5 }, '100%': { transform: 'scale(1.65)', opacity: 0 } },
          }} />
          <Fab
            color="primary"
            onClick={handleCreateAlarm}
            sx={{ boxShadow: '0 8px 28px rgba(255,107,53,0.5)', '&:active': { transform: 'scale(0.94)' } }}
          >
            <AddIcon />
          </Fab>
        </Box>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <EditAlarmDialog
          alarm={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={updates => { editAlarm(editTarget.id, updates); setEditTarget(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Alarm?"
          body={`Remove "${deleteTarget.label || formatTime(deleteTarget.time)}"? This can't be undone.`}
          confirmLabel="Delete"
          confirmColor="error"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteAlarm(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Alarm Card ───────────────────────────────────────────────────────────────

function AndroidReadinessCard({ status, onFix, onRefresh }) {
  if (!status?.isNative) return null;

  const checks = [
    { key: 'exactAlarm', label: 'Exact alarms', detail: 'Required for precise wake-up time' },
    { key: 'postNotifications', label: 'Notifications', detail: 'Required for lock-screen alerts' },
    { key: 'fullScreenIntent', label: 'Full-screen launch', detail: 'Needed when the phone is locked' },
    { key: 'batteryOptimization', label: 'Battery unrestricted', detail: 'Prevents missed alarms in sleep mode' },
  ];
  const missing = checks.filter((check) => !status[check.key]);
  const ready = Boolean(status.exactAlarm);

  // When ready, show only a tiny inline indicator — no big card
  if (ready) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 1.5, opacity: 0.55 }}>
        <CheckCircleOutlineIcon sx={{ color: '#06D6A0', fontSize: '0.85rem' }} />
        <Typography sx={{ color: '#06D6A0', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          Alarm setup ready
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{
      mb: 2,
      p: 1.6,
      borderRadius: 3,
      bgcolor: 'rgba(255,107,53,0.07)',
      border: '1px solid rgba(255,107,53,0.18)',
      boxShadow: 'none',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          bgcolor: 'rgba(255,107,53,0.13)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <WarningAmberIcon sx={{ color: '#FF9A6D', fontSize: '1.2rem' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: '#FFF5DF', fontSize: '0.94rem' }}>
            Finish Android alarm setup
          </Typography>
          <Typography sx={{ mt: 0.25, color: 'rgba(255,255,255,0.58)', fontSize: '0.74rem', lineHeight: 1.45 }}>
            {`${missing.length} setting${missing.length === 1 ? '' : 's'} still need attention before alarms can be trusted.`}
          </Typography>

          <Box sx={{ mt: 1.2, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
            {checks.map((check) => {
              const ok = Boolean(status[check.key]);
              return (
                <Box key={check.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  {ok ? (
                    <CheckCircleOutlineIcon sx={{ color: '#06D6A0', fontSize: '0.95rem' }} />
                  ) : (
                    <WarningAmberIcon sx={{ color: '#FF9A6D', fontSize: '0.95rem' }} />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.72rem', fontWeight: 700 }}>
                      {check.label}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.44)', fontSize: '0.62rem' }}>
                      {check.detail}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 1.3 }}>
            <Button
              variant="contained"
              size="small"
              onClick={onFix}
              disabled={status.loading}
              sx={{ borderRadius: 2, px: 1.4, py: 0.55, fontSize: '0.72rem' }}
            >
              Open Settings
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={onRefresh}
              disabled={status.loading}
              sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.72rem' }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

function AlarmCard({ alarm, isNext, now, onToggle, onDelete, onEdit, onTest }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const pulseColor = PULSE_COLORS[alarm.pulse?.intensity] || '#FF6B35';
  const nextFire   = getNextFire(alarm);
  const minsUntil  = nextFire ? Math.round((nextFire - now) / 60000) : null;
  const countdown  = minsUntil == null ? null
    : minsUntil < 60 ? `in ${minsUntil}m`
    : `in ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;

  function closeMenu() { setMenuAnchor(null); }
  function handleTestAlarm() {
    closeMenu();
    requestAnimationFrame(() => {
      onTest();
    });
  }

  return (
    <Box sx={{
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      bgcolor: alarm.active ? 'rgba(20,20,36,0.95)' : 'rgba(16,16,26,0.7)',
      border: '1px solid',
      borderColor: alarm.active ? `${pulseColor}20` : 'rgba(255,255,255,0.05)',
      opacity: alarm.active ? 1 : 0.5,
      transition: 'opacity 0.25s, border-color 0.25s',
      backdropFilter: 'blur(6px)',
    }}>
      {/* Active top edge gradient */}
      {alarm.active && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, ${pulseColor}90 0%, ${pulseColor}00 70%)`,
        }} />
      )}

      {/* ── Row 1: label / badge + switch + menu ── */}
      <Box sx={{ px: 2, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          {isNext && alarm.active && (
            <Box sx={{
              px: 0.9, py: 0.15, borderRadius: 1, flexShrink: 0,
              bgcolor: 'rgba(255,107,53,0.15)',
              border: '1px solid rgba(255,107,53,0.3)',
              fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.08em',
              color: '#FF6B35', lineHeight: 1.7,
            }}>
              NEXT
            </Box>
          )}
          <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', fontWeight: 500 }} noWrap>
            {alarm.label || 'Alarm'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
          <Switch
            checked={alarm.active}
            onChange={onToggle}
            color="primary"
            size="small"
            sx={{ mr: -0.5 }}
          />
          <IconButton
            onClick={e => setMenuAnchor(e.currentTarget)}
            sx={{ color: 'rgba(255,255,255,0.3)', p: 0.75, touchAction: 'manipulation' }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Row 2: time + countdown ── */}
      <Box sx={{ px: 2, pb: 0, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
        <Typography
          sx={{
            fontSize: '2.6rem',
            fontFamily: '"Fraunces", serif',
            fontWeight: 700,
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-1.5px',
            ...(isNext && alarm.active && {
              animation: 'nextGlow 4s ease-in-out infinite',
              '@keyframes nextGlow': {
                '0%,100%': { textShadow: 'none' },
                '50%':     { textShadow: `0 0 28px ${pulseColor}66` },
              },
            }),
          }}
        >
          {formatTime(alarm.time)}
        </Typography>
        {alarm.active && countdown && (
          <Typography sx={{ fontWeight: 700, color: pulseColor, opacity: 0.85, pb: 0.25, fontSize: '0.78rem' }}>
            {countdown}
          </Typography>
        )}
      </Box>

      {/* ── Row 3: days ── */}
      {alarm.days?.length > 0 && (
        <Box sx={{ px: 2, pt: 1.25, display: 'flex', gap: 0.5 }}>
          {DAY_LABELS.map((d, i) => {
            const on = alarm.days.includes(i);
            return (
              <Box key={i} sx={{
                width: 25, height: 25, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: on ? `${pulseColor}20` : 'rgba(255,255,255,0.04)',
                color: on ? pulseColor : 'rgba(255,255,255,0.18)',
                fontWeight: 700, fontSize: '0.56rem',
                border: on ? `1px solid ${pulseColor}40` : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {d}
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Row 4: pulse info ── */}
      {alarm.pulse && (
        <Box sx={{ px: 2, pt: 1.1, pb: 2, display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Box sx={{
            px: 1.1, py: 0.25, borderRadius: 1.5,
            bgcolor: `${pulseColor}12`, color: pulseColor,
            fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.7,
            border: `1px solid ${pulseColor}22`,
          }}>
            {PULSE_LABELS[alarm.pulse.intensity]}
          </Box>
          <Box sx={{
            px: 1.1, py: 0.25, borderRadius: 1.5,
            bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.38)',
            fontSize: '0.6rem', fontWeight: 600, lineHeight: 1.7,
          }}>
            {alarm.pulse.games?.length || 1} game{alarm.pulse.games?.length !== 1 ? 's' : ''}
          </Box>
        </Box>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            bgcolor: '#1C1C34', borderRadius: 2.5,
            border: '1px solid rgba(255,255,255,0.09)',
            minWidth: 170,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          },
        }}
      >
        <MenuItem onClick={handleTestAlarm} sx={{ gap: 1.5, py: 1.25, fontSize: '0.88rem' }}>
          <AlarmIcon fontSize="small" sx={{ color: 'primary.main' }} /> Test alarm
        </MenuItem>
        <MenuItem onClick={() => { onEdit(); closeMenu(); }} sx={{ gap: 1.5, py: 1.25, fontSize: '0.88rem' }}>
          <EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} /> Edit
        </MenuItem>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', my: 0.25 }} />
        <MenuItem
          onClick={() => { onDelete(); closeMenu(); }}
          sx={{ gap: 1.5, py: 1.25, fontSize: '0.88rem', color: 'error.main' }}
        >
          <DeleteOutlineIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

// ─── Edit Alarm Dialog ────────────────────────────────────────────────────────

function EditAlarmDialog({ alarm, onClose, onSave }) {
  const [label, setLabel] = useState(alarm.label || '');
  const [time,  setTime]  = useState(alarm.time  || '07:00');
  const [days,  setDays]  = useState(alarm.days  || []);
  const [sound, setSound] = useState(alarm.sound || alarm.pulse?.sound || 'gentle_chime');
  const [deviceSoundName, setDeviceSoundName] = useState('');
  const [soundPickerOpen, setSoundPickerOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    function updateViewportMode() {
      if (typeof window === 'undefined') return;
      setIsCompactViewport(window.innerHeight <= 700 || window.innerWidth <= 380);
    }

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  function toggleDay(i) {
    setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  }

  const selectedSoundLabel = sound?.startsWith('content://')
    ? deviceSoundName || 'Device sound'
    : ALARM_SOUNDS.find(s => s.id === sound)?.label || 'Required';

  async function handlePreviewSound() {
    if (isNative) {
      await previewNativeSound(sound, 3000);
      return;
    }
    previewAlarmSound(sound);
  }

  async function handlePickDeviceSound() {
    if (!isNative) return;
    const picked = await openRingtonePicker();
    if (!picked?.uri) return;
    setDeviceSoundName(picked.name || 'Device sound');
    setSound(picked.uri);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      fullScreen={isCompactViewport}
      maxWidth="xs"
      PaperProps={{
        sx: isCompactViewport ? {
          borderRadius: 0,
          maxHeight: '100dvh',
          height: '100dvh',
        } : {
          maxHeight: 'min(680px, calc(100dvh - 32px))',
        },
      }}
      sx={isCompactViewport ? { padding: 0 } : undefined}
    >
      <DialogTitle fontWeight={800} sx={{
        pb: 1,
        pt: isCompactViewport ? 2 : undefined,
        px: isCompactViewport ? 2 : undefined,
        flexShrink: 0,
      }}>
        Edit Alarm
      </DialogTitle>
      <DialogContent sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: isCompactViewport ? 2.25 : 3,
        pt: '8px !important',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        pb: isCompactViewport ? 2 : undefined,
      }}>
        <TextField
          label="Label" value={label} onChange={e => setLabel(e.target.value)}
          fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
          sx={dialogFieldSx}
        />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Time</Typography>
          <TimePicker value={time} onChange={setTime} />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>Sound</Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setSoundPickerOpen(true)}
            startIcon={<NotificationsActiveIcon />}
            sx={{
              justifyContent: 'space-between',
              borderRadius: 2.5,
              py: 1.2,
              color: '#FFF5DF',
              borderColor: 'rgba(255,209,102,0.28)',
              bgcolor: 'rgba(255,209,102,0.08)',
              '&:hover': { borderColor: 'rgba(255,209,102,0.42)', bgcolor: 'rgba(255,209,102,0.12)' },
            }}
          >
            <span>Alarm Sounds</span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{selectedSoundLabel}</span>
          </Button>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Repeat on</Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {DAY_LABELS.map((d, i) => (
              <Box
                key={i}
                onPointerDown={() => toggleDay(i)}
                sx={{
                  flex: 1, aspectRatio: '1', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: days.includes(i) ? 'primary.main' : 'rgba(255,255,255,0.07)',
                  cursor: 'pointer', fontWeight: 700, fontSize: isCompactViewport ? '0.62rem' : '0.68rem',
                  minHeight: isCompactViewport ? 40 : undefined,
                  userSelect: 'none', touchAction: 'manipulation',
                  transition: 'background 0.15s, transform 0.1s',
                  '&:active': { transform: 'scale(0.9)' },
                }}
              >
                {d}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{
        p: isCompactViewport ? 2 : 2,
        gap: 1,
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        background: 'rgba(22,22,42,0.96)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        justifyContent: 'space-between',
        pb: isCompactViewport ? 'max(env(safe-area-inset-bottom), 16px)' : undefined,
      }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', flex: 1 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({
            label,
            time,
            days,
            sound,
            pulse: { ...(alarm.pulse || {}), sound },
          })}
          sx={{ flex: 1 }}
        >
          Save
        </Button>
      </DialogActions>

      <Dialog
        open={soundPickerOpen}
        onClose={() => setSoundPickerOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: '#151A28',
            backgroundImage: 'linear-gradient(180deg, #1E2636 0%, #121827 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.62)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 0.75 }}>
          <Box sx={{ width: 42, height: 4, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.16)', mx: 'auto', mb: 1.6 }} />
          <Typography fontWeight={900} sx={{ color: '#FFF5DF' }}>Alarm Sounds</Typography>
          <Typography sx={{ color: '#FFD166', fontSize: '0.76rem', fontWeight: 800 }}>{selectedSoundLabel}</Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: '8px !important' }}>
          {ALARM_SOUNDS.map(option => {
            const selected = sound === option.id;
            return (
              <Button
                key={option.id}
                onClick={() => setSound(option.id)}
                variant="outlined"
                sx={{
                  justifyContent: 'space-between',
                  borderRadius: 2.4,
                  py: 1.05,
                  px: 1.25,
                  color: selected ? '#FFD166' : '#FFF5DF',
                  borderColor: selected ? 'rgba(255,209,102,0.6)' : 'rgba(255,255,255,0.1)',
                  bgcolor: selected ? 'rgba(255,209,102,0.12)' : 'rgba(255,255,255,0.045)',
                  textTransform: 'none',
                  boxShadow: selected ? '0 8px 22px rgba(255,209,102,0.10)' : 'none',
                }}
              >
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 850 }}>{option.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>{option.desc}</span>
                </span>
                {selected && <span style={{ color: '#FFD166', fontWeight: 900 }}>✓</span>}
              </Button>
            );
          })}
          <Button
            variant="outlined"
            onClick={handlePickDeviceSound}
            disabled={!isNative}
            startIcon={<NotificationsActiveIcon />}
            sx={{
              borderRadius: 2.4,
              py: 1.1,
              mt: 0.5,
              color: '#FFF5DF',
              borderColor: 'rgba(255,209,102,0.28)',
              bgcolor: 'rgba(255,209,102,0.07)',
              textTransform: 'none',
              fontWeight: 800,
            }}
          >
            Choose from device
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handlePreviewSound}
            startIcon={<PlayArrowIcon />}
            sx={{ color: '#FF6B35', flex: 1, borderRadius: 2.4, fontWeight: 900, textTransform: 'none' }}
          >
            Preview
          </Button>
          <Button variant="contained" onClick={() => setSoundPickerOpen(false)} sx={{ flex: 1, borderRadius: 2.4, fontWeight: 900, textTransform: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

const dialogFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#FF6B35' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' },
};

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { user, alarms, XP_PER_LEVEL, wakeStats, refreshWakeStats, session } = useApp();
  const xpInLevel   = user.xp % XP_PER_LEVEL;
  const xpToNext    = XP_PER_LEVEL - xpInLevel;
  const xpPct       = (xpInLevel / XP_PER_LEVEL) * 100;
  const activeCount = alarms.filter(a => a.active).length;

  const levelNodes  = [-2, -1, 0, 1, 2].map(offset => user.level + offset).filter(l => l >= 1);

  const RANK_LABELS = { 1: 'Newcomer', 2: 'Riser', 3: 'Consistent', 4: 'Dedicated', 5: 'Champion', 6: 'Legend' };
  const rankLabel   = RANK_LABELS[Math.min(user.level, 6)] || 'Legend';

  useEffect(() => {
    if (!session?.user?.id) return;
    refreshWakeStats?.(session.user.id);
  }, [session?.user?.id, refreshWakeStats]);

  return (
    <Box>
      {/* Header hero */}
      <Box sx={{
        background: 'linear-gradient(170deg, #16082E 0%, #14142A 55%, #0D0D1A 100%)',
        px: 3, pt: 5.5, pb: 4,
        borderBottom: '1px solid rgba(255,107,53,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
          top: -100, right: -60, filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Big level display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
          <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <Box sx={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              background: 'conic-gradient(from 210deg, rgba(255,107,53,0.14) 0deg, #FF6B35 110deg, #FFD166 220deg, rgba(255,255,255,0.12) 300deg, rgba(255,107,53,0.14) 360deg)',
              boxShadow: '0 14px 32px rgba(255,107,53,0.2)',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 2.5,
                borderRadius: '50%',
                background: '#130B1F',
              },
            }} />
            <Box sx={{
              position: 'absolute', inset: -2, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }} />
            <Box sx={{
              position: 'absolute',
              top: 6,
              left: 10,
              width: 24,
              height: 12,
              borderRadius: 999,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0))',
              filter: 'blur(1px)',
              opacity: 0.85,
              pointerEvents: 'none',
            }} />
            <Avatar sx={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #FF6B35 0%, #E54E1B 100%)',
              fontWeight: 900, fontSize: '1.7rem',
              fontFamily: '"Fraunces", serif',
              boxShadow: '0 0 32px rgba(255,107,53,0.28)',
            }}>
              {user.level}
            </Avatar>
          </Box>
          <Box>
            <Typography sx={{ color: '#FF6B35', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.58rem', mb: 0.25 }}>
              CURRENT RANK
            </Typography>
            <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              {rankLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {user.xp} total XP earned
            </Typography>
          </Box>
        </Box>

        {/* XP bar */}
        <Box sx={{
          p: 2, borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>
              Level {user.level} → {user.level + 1}
            </Typography>
            <Typography sx={{ fontWeight: 800, color: '#FF6B35', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
              {xpInLevel}/{XP_PER_LEVEL} XP
            </Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={xpPct}
              sx={{
                height: 10, borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.07)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, #FF6B35 0%, #FFD166 100%)',
                  boxShadow: '0 0 14px rgba(255,107,53,0.5)',
                },
              }}
            />
            {[0.25, 0.5, 0.75].map(pct => (
              <Box key={pct} sx={{
                position: 'absolute', top: '50%', left: `${pct * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 3, height: 3, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
                bgcolor: xpPct / 100 >= pct ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
              }} />
            ))}
          </Box>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', mt: 0.75, display: 'block' }}>
            {xpToNext} XP needed to reach Level {user.level + 1}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Level journey */}
        <Card sx={{ p: 2.5, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem', mb: 2, display: 'block' }}>
            LEVEL JOURNEY
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {levelNodes.map((lvl, i) => {
              const isCurrent = lvl === user.level;
              const isPast    = lvl < user.level;
              return (
                <Box key={lvl} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: isCurrent ? 46 : 32, height: isCurrent ? 46 : 32,
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'linear-gradient(135deg, #FF6B35, #FFD166)'
                        : isPast ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
                      border: isCurrent ? 'none' : isPast ? '1.5px solid rgba(255,107,53,0.35)' : '1.5px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: isCurrent ? '0.88rem' : '0.68rem',
                      fontFamily: isCurrent ? '"Fraunces", serif' : 'inherit',
                      color: isCurrent ? '#fff' : isPast ? '#FF6B35' : 'rgba(255,255,255,0.25)',
                      boxShadow: isCurrent ? '0 0 20px rgba(255,107,53,0.5)' : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {isPast
                        ? <CheckCircleOutlineIcon sx={{ fontSize: isCurrent ? '1.2rem' : '0.88rem', color: '#FF6B35' }} />
                        : lvl}
                    </Box>
                    <Typography sx={{ fontSize: '0.52rem', fontWeight: isCurrent ? 800 : 500,
                      color: isCurrent ? 'primary.main' : 'text.disabled' }}>
                      {isCurrent ? 'YOU' : `Lv.${lvl}`}
                    </Typography>
                  </Box>
                  {i < levelNodes.length - 1 && (
                    <Box sx={{
                      flex: 1, height: 2, mx: 0.5,
                      bgcolor: lvl < user.level ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.06)',
                      borderRadius: 1,
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Metric grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
          <MetricCard Icon={LocalFireDepartmentIcon} label="Day Streak"    value={user.streak}           unit={user.streak === 1 ? 'day' : 'days'} color="#FFD166" />
          <MetricCard Icon={EmojiEventsIcon}         label="Total XP"      value={user.xp}               color="#FF6B35" />
          <MetricCard Icon={AlarmIcon}               label="Alarms Set"    value={alarms.length}         color="#06D6A0" />
          <MetricCard Icon={NotificationsActiveIcon} label="Active"        value={activeCount}           color="#8B5CF6" />
          <MetricCard Icon={TaskAltIcon}             label="Routines Won"  value={wakeStats?.success ?? 0} color="#06D6A0" />
          <MetricCard Icon={WarningAmberIcon}        label="Routines Lost" value={wakeStats?.failed ?? 0}  color="#EF476F" />
        </Box>

        {/* Demerit warning */}
        {user.demerits > 0 && (
          <Card sx={{ p: 2.5, bgcolor: 'rgba(239,71,111,0.06)', border: '1px solid rgba(239,71,111,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
                bgcolor: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WarningAmberIcon sx={{ fontSize: '1.4rem', color: '#EF476F' }} />
              </Box>
              <Box>
                <Typography fontWeight={800} color="#EF476F">
                  {user.demerits} Demerit{user.demerits !== 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Wake up on time to clear these and protect your XP.
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        {/* Next milestone */}
        <Card sx={{ p: 2.5, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem', mb: 1.5, display: 'block' }}>
            NEXT MILESTONE
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
              bgcolor: 'rgba(255,107,53,0.08)', border: '1px dashed rgba(255,107,53,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EmojiEventsIcon sx={{ fontSize: '1.4rem', color: '#FFD166' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800} sx={{ letterSpacing: '-0.2px' }}>
                Reach Level {user.level + 1}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                <LinearProgress
                  variant="determinate"
                  value={xpPct}
                  sx={{
                    flex: 1, height: 5, borderRadius: 99,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { borderRadius: 99, background: 'linear-gradient(90deg, #FF6B35, #FFD166)' },
                  }}
                />
                <Typography sx={{ color: '#FF6B35', fontWeight: 700, fontSize: '0.62rem', flexShrink: 0 }}>
                  {Math.round(xpPct)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({ Icon, label, value, unit, color }) {
  return (
    <Box sx={{
      p: 2.5, borderRadius: '20px',
      bgcolor: 'rgba(18,18,32,0.9)',
      border: `1px solid ${color}18`,
      position: 'relative', overflow: 'hidden',
      backdropFilter: 'blur(6px)',
    }}>
      {/* Corner glow */}
      <Box sx={{
        position: 'absolute', top: -16, right: -16,
        width: 70, height: 70, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22, transparent 70%)`,
        filter: 'blur(12px)', pointerEvents: 'none',
      }} />
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 2.25, mb: 1.5,
        bgcolor: `${color}14`, border: `1px solid ${color}22`,
        position: 'relative',
      }}>
        <Icon sx={{ fontSize: '1.2rem', color }} />
      </Box>
      <Typography sx={{
        fontFamily: '"Fraunces", serif',
        fontSize: '1.9rem', fontWeight: 700, lineHeight: 1,
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </Typography>
      {unit && <Typography variant="caption" color="text.secondary"> {unit}</Typography>}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.62rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const MORNING_TYPES_PROFILE = [
  { value: 1, Icon: NightsStayIcon, label: 'Night Owl' },
  { value: 2, Icon: SnoozeIcon,     label: 'Slow Starter' },
  { value: 3, Icon: DragHandleIcon, label: 'In Between' },
  { value: 4, Icon: WbTwilightIcon, label: 'Early Bird' },
  { value: 5, Icon: FlashOnIcon,    label: 'Morning Person' },
];

const GAMES_PROFILE = [
  { value: 'math',     Icon: CalculateIcon, label: 'Math Blitz' },
  { value: 'memory',   Icon: StyleIcon,     label: 'Memory Match' },
  { value: 'reaction', Icon: BoltIcon,      label: 'Reaction Rush' },
];

const COUNTRY_PRESETS_PROFILE = [
  'South Africa',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
];

const COUNTRIES_PROFILE = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Botswana', 'Brazil', 'Canada', 'Chile', 'China',
  'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Ghana',
  'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan',
  'Kenya', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Saudi Arabia', 'Serbia',
  'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Thailand',
  'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam', 'Zambia', 'Zimbabwe',
];

function ProfileTab() {
  const { session, user, resetAll, updateUser, signOut } = useApp();
  const [editing,       setEditing]      = useState(false);
  const [draft,         setDraft]        = useState(null);
  const [confirmReset,  setConfirmReset] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const filteredCountries = COUNTRIES_PROFILE.filter((country) => country.toLowerCase().includes(countryQuery.trim().toLowerCase()));

  const avatarOpt = AVATAR_OPTIONS.find(a => a.value === (editing && draft ? draft.profileIcon : user.profileIcon)) ?? AVATAR_OPTIONS[0];
  const morningLabel = MORNING_TYPES_PROFILE.find(t => t.value === user.morningRating)?.label || '—';
  const gameLabel    = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' }[user.favoriteGame] || '—';
  const email = session?.user?.email || '—';

  function startEdit() {
    setDraft({
      name: user.name,
      age: user.age || '',
      country: user.country || '',
      wakeTime: user.wakeTime,
      morningRating: user.morningRating,
      favoriteGame: user.favoriteGame,
      wakeGoal: user.wakeGoal || '',
      profileIcon: user.profileIcon,
    });
    setCountryQuery('');
    setEditing(true);
  }

  function saveEdit() {
    if (!draft.name.trim()) return;
    if (!draft.country.trim()) return;
    if (draft.age && (!Number.isInteger(Number(draft.age)) || Number(draft.age) < 1 || Number(draft.age) > 120)) return;
    updateUser(draft);
    setEditing(false);
    setDraft(null);
    setCountryPickerOpen(false);
    setCountryQuery('');
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setCountryPickerOpen(false);
    setCountryQuery('');
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(170deg, #16082E 0%, #14142A 55%, #0D0D1A 100%)',
        p: 3, pt: 5.5, pb: 4,
        borderBottom: '1px solid rgba(255,107,53,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
          top: -80, right: -60, filter: 'blur(44px)', pointerEvents: 'none',
          animation: 'profOrb 11s ease-in-out infinite',
          '@keyframes profOrb': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } },
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 66, height: 66, borderRadius: '50%', flexShrink: 0,
              bgcolor: `${avatarOpt.color}18`,
              border: `2.5px solid ${avatarOpt.color}`,
              boxShadow: `0 0 0 3px ${avatarOpt.color}18, 0 0 30px ${avatarOpt.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
            }}>
              <avatarOpt.Icon sx={{ fontSize: '1.85rem', color: avatarOpt.color }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>
                {editing ? (draft.name || 'Your Name') : user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Level {user.level} · {user.xp} XP total
              </Typography>
            </Box>
          </Box>
          {!editing && (
            <IconButton
              onClick={startEdit}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {editing ? (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Email</Typography>
              <TextField
                fullWidth size="small" value={email} disabled
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Name</Typography>
              <TextField
                fullWidth variant="standard"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                inputProps={{ maxLength: 30 }}
                sx={{
                  '& .MuiInput-input': { fontSize: '1.1rem', fontWeight: 600, py: 0.75 },
                  '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
                  '& .MuiInput-underline:after':  { borderBottomColor: '#FF6B35' },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Age</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter your age"
                value={draft.age}
                onChange={e => setDraft(d => ({ ...d, age: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                inputProps={{ inputMode: 'numeric', maxLength: 3 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Country</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.25 }}>
                {COUNTRY_PRESETS_PROFILE.map(country => {
                  const selected = draft.country === country;
                  return (
                    <Box
                      key={country}
                      onClick={() => setDraft(d => ({ ...d, country: selected ? '' : country }))}
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        borderRadius: 20,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        background: selected ? 'rgba(255,107,53,0.08)' : '#111827',
                        border: `1px solid ${selected ? '#FF6B35' : '#2d3748'}`,
                      }}
                    >
                      <PublicIcon sx={{ fontSize: '0.9rem', color: selected ? '#FF6B35' : '#6b7280' }} />
                      <Typography variant="body2" sx={{ color: selected ? '#FF6B35' : '#9ca3af', fontWeight: selected ? 700 : 500 }}>
                        {country}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box
                onClick={() => setCountryPickerOpen(true)}
                sx={{
                  background: '#111827',
                  border: `1px solid ${draft.country ? '#FF6B35' : '#2d3748'}`,
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                }}
              >
                <PublicIcon sx={{ color: draft.country ? '#FF6B35' : '#6b7280', fontSize: '1.1rem' }} />
                <Typography sx={{ flex: 1, color: draft.country ? '#f9fafb' : '#6b7280', fontWeight: draft.country ? 600 : 500 }}>
                  {draft.country || 'Pick your country'}
                </Typography>
                <ExpandMoreIcon sx={{ color: '#6b7280', fontSize: '1.1rem' }} />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Default Wake-up Time</Typography>
              <TextField
                type="time" value={draft.wakeTime}
                onChange={e => setDraft(d => ({ ...d, wakeTime: e.target.value }))}
                size="small" fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>Morning Type</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {MORNING_TYPES_PROFILE.map(type => {
                  const sel = draft.morningRating === type.value;
                  return (
                    <Box
                      key={type.value}
                      onClick={() => setDraft(d => ({ ...d, morningRating: type.value }))}
                      sx={{
                        px: 2, py: 1.25, borderRadius: 2.5, cursor: 'pointer',
                        border: sel ? '1.5px solid rgba(255,107,53,0.45)' : '1.5px solid rgba(255,255,255,0.06)',
                        bgcolor: sel ? 'rgba(255,107,53,0.07)' : 'rgba(255,255,255,0.025)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'all 0.18s', touchAction: 'manipulation',
                        '&:active': { transform: 'scale(0.98)' },
                      }}
                    >
                      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: sel ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <type.Icon sx={{ fontSize: '1rem', color: sel ? 'primary.main' : 'text.secondary' }} />
                      </Box>
                      <Typography variant="body2" fontWeight={sel ? 700 : 400} sx={{ color: sel ? 'primary.main' : 'text.primary' }}>
                        {type.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>Preferred Game</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {GAMES_PROFILE.map(game => {
                  const sel = draft.favoriteGame === game.value;
                  return (
                    <Box
                      key={game.value}
                      onClick={() => setDraft(d => ({ ...d, favoriteGame: game.value }))}
                      sx={{
                        px: 2, py: 1.25, borderRadius: 2.5, cursor: 'pointer',
                        border: sel ? '1.5px solid rgba(255,107,53,0.45)' : '1.5px solid rgba(255,255,255,0.06)',
                        bgcolor: sel ? 'rgba(255,107,53,0.07)' : 'rgba(255,255,255,0.025)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'all 0.18s', touchAction: 'manipulation',
                        '&:active': { transform: 'scale(0.98)' },
                      }}
                    >
                      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: sel ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <game.Icon sx={{ fontSize: '1rem', color: sel ? 'primary.main' : 'text.secondary' }} />
                      </Box>
                      <Typography variant="body2" fontWeight={sel ? 700 : 400} sx={{ color: sel ? 'primary.main' : 'text.primary' }}>
                        {game.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Morning Goal</Typography>
              <TextField
                fullWidth multiline rows={2}
                placeholder="What gets you out of bed?"
                value={draft.wakeGoal}
                onChange={e => setDraft(d => ({ ...d, wakeGoal: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 60 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                {draft.wakeGoal.length}/60
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>Profile Icon</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
                {AVATAR_OPTIONS.map((opt) => {
                  const selected = draft.profileIcon === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      onClick={() => setDraft(d => ({ ...d, profileIcon: opt.value }))}
                      sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selected ? `${opt.color}18` : '#111827',
                          border: `1px solid ${selected ? opt.color : '#2d3748'}`,
                        }}
                      >
                        <opt.Icon sx={{ fontSize: '1.45rem', color: selected ? opt.color : '#6b7280' }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: selected ? opt.color : '#6b7280', fontWeight: selected ? 700 : 500, textAlign: 'center' }}>
                        {opt.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
              <Button
                variant="outlined" fullWidth onClick={cancelEdit}
                sx={{ borderRadius: 2.5, color: 'text.secondary', borderColor: 'rgba(255,255,255,0.12)', '&:hover': { borderColor: 'rgba(255,255,255,0.25)' } }}
              >
                Cancel
              </Button>
              <Button
                variant="contained" fullWidth onClick={saveEdit}
                disabled={!draft.name.trim() || !draft.country.trim() || (draft.age && (!Number.isInteger(Number(draft.age)) || Number(draft.age) < 1 || Number(draft.age) > 120))}
              >
                Save Changes
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Card sx={{ bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <ProfileRow label="Email"                value={email} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Age"                  value={user.age || '-'} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Country"              value={user.country || '-'} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Profile icon"         value={avatarOpt.label} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Default wake-up time" value={formatTime(user.wakeTime)} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Morning type"         value={morningLabel} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
              <ProfileRow label="Preferred game"       value={gameLabel} />
              {user.wakeGoal && (
                <>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.055)' }} />
                  <ProfileRow label="Morning goal" value={user.wakeGoal} />
                </>
              )}
            </Card>

            <Button
              variant="outlined" fullWidth
              onClick={() => setConfirmLogout(true)}
              sx={{ mt: 0.5, borderRadius: 2.5, py: 1.25, borderColor: 'rgba(255,255,255,0.12)', color: 'text.secondary', '&:hover': { borderColor: 'rgba(255,255,255,0.25)', bgcolor: 'rgba(255,255,255,0.04)' } }}
            >
              Log Out
            </Button>

            <Button
              variant="outlined" color="error" fullWidth
              onClick={() => setConfirmReset(true)}
              sx={{ borderRadius: 2.5, py: 1.25 }}
            >
              Reset All Data
            </Button>
          </>
        )}

        <Dialog
          open={countryPickerOpen}
          onClose={() => setCountryPickerOpen(false)}
          fullScreen
          PaperProps={{ sx: { background: '#111827' } }}
        >
          <DialogTitle sx={{ p: 0 }}>
            <Box sx={{ px: 2, pt: 'max(env(safe-area-inset-top), 18px)', pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                onClick={() => setCountryPickerOpen(false)}
                sx={{ width: 36, height: 36, bgcolor: '#1f2937', borderRadius: '10px', color: '#9ca3af' }}
              >
                <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
              <Box sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.1rem', color: '#f9fafb' }}>
                Select country
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 2, pb: 'max(24px, env(safe-area-inset-bottom))', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ pb: 1.5 }}>
              <Box
                sx={{
                  background: '#1E2533',
                  border: '1px solid #2d3748',
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                }}
              >
                <SearchIcon sx={{ color: '#6b7280', fontSize: '1.15rem', flexShrink: 0 }} />
                <Box
                  component="input"
                  autoFocus
                  placeholder="Search countries..."
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#f9fafb',
                    caretColor: '#FF6B35',
                    fontSize: '0.98rem',
                    fontFamily: '"Outfit", sans-serif',
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredCountries.map((country) => {
                const selected = draft?.country === country;
                return (
                  <Box
                    key={country}
                    onClick={() => {
                      setDraft((d) => ({ ...d, country }));
                      setCountryPickerOpen(false);
                      setCountryQuery('');
                    }}
                    sx={{
                      px: 2,
                      py: 1.45,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: selected ? 'rgba(255,107,53,0.09)' : '#1E2533',
                      border: `1px solid ${selected ? '#FF6B35' : '#262f40'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <PublicIcon sx={{ fontSize: '1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
                      <Box sx={{ color: selected ? '#f9fafb' : '#d1d5db', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                        {country}
                      </Box>
                    </Box>
                    {selected && (
                      <Box sx={{ color: '#FF6B35', fontWeight: 700, fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                        Selected
                      </Box>
                    )}
                  </Box>
                );
              })}
              {filteredCountries.length === 0 && (
                <Box sx={{ px: 2, py: 2.5, borderRadius: '14px', background: '#1E2533', border: '1px solid #262f40', color: '#6b7280', fontFamily: '"Outfit", sans-serif', textAlign: 'center' }}>
                  No countries match that search.
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmLogout}
          title="Log Out?"
          body="You'll be signed out of MorninMate. Your data will be saved and waiting when you log back in."
          confirmLabel="Log Out"
          onClose={() => setConfirmLogout(false)}
          onConfirm={() => { signOut(); setConfirmLogout(false); }}
        />

        <ConfirmDialog
          open={confirmReset}
          title="Reset Everything?"
          body="This will delete all your alarms, progress, XP, and profile data. You'll start fresh from onboarding."
          confirmLabel="Reset"
          confirmColor="error"
          onClose={() => setConfirmReset(false)}
          onConfirm={() => { resetAll(); setConfirmReset(false); }}
        />
      </Box>
    </Box>
  );
}

function ProfileRow({ label, value }) {
  return (
    <Box sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', color: 'text.primary' }}>{value}</Typography>
    </Box>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function ConfirmDialog({ open = true, title, body, confirmLabel, confirmColor = 'primary', onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle fontWeight={800}>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{body}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

function EmptyState({ onAdd }) {
  return (
    <Box sx={{
      p: 4, pb: 4.5, textAlign: 'center', borderRadius: '20px',
      border: '1px dashed rgba(255,107,53,0.2)',
      bgcolor: 'rgba(255,107,53,0.03)',
    }}>
      <Box sx={{
        display: 'inline-flex', mb: 2.5,
        animation: 'emptyFloat 3.5s ease-in-out infinite',
        '@keyframes emptyFloat': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      }}>
        <Box sx={{
          p: 2.5, borderRadius: '50%',
          bgcolor: 'rgba(255,107,53,0.07)',
          border: '1px solid rgba(255,107,53,0.15)',
          boxShadow: '0 0 30px rgba(255,107,53,0.12)',
        }}>
          <AlarmIcon sx={{ fontSize: '2.75rem', color: 'primary.main', opacity: 0.75 }} />
        </Box>
      </Box>
      <Typography variant="h6" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.3px' }}>
        No alarms yet, mate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25, lineHeight: 1.6 }}>
        Chuck in your first alarm and get your morning sorted
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        Create Alarm
      </Button>
    </Box>
  );
}
