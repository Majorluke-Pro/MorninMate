import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, IconButton, Switch, LinearProgress,
  Chip, Fab, BottomNavigation, BottomNavigationAction,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Divider, Avatar, Menu, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlarmIcon from '@mui/icons-material/Alarm';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const PULSE_COLORS = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F' };
const PULSE_LABELS = { gentle: 'Gentle', moderate: 'Moderate', intense: 'Intense' };
const DAY_LABELS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 8 }}>
        {tab === 0 && <AlarmsTab onNavigate={navigate} />}
        {tab === 1 && <StatsTab />}
        {tab === 2 && <ProfileTab />}
      </Box>

      <BottomNavigation
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          bgcolor: 'rgba(17,17,40,0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          '& .MuiBottomNavigationAction-root':  { color: 'rgba(255,255,255,0.32)', minWidth: 0 },
          '& .Mui-selected':                    { color: '#FF6B35 !important' },
          '& .MuiBottomNavigationAction-label': { fontSize: '0.62rem', fontWeight: 600 },
        }}
      >
        <BottomNavigationAction label="Alarms"  icon={<HomeIcon />} />
        <BottomNavigationAction label="Stats"   icon={<BarChartIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}

// ─── Alarms Tab ───────────────────────────────────────────────────────────────

function AlarmsTab({ onNavigate }) {
  const { user, alarms, toggleAlarm, deleteAlarm, editAlarm, xpProgress, XP_PER_LEVEL, triggerAlarm } = useApp();
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [now, setNow]                   = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const xpInLevel = user.xp % XP_PER_LEVEL;

  const sortedAlarms = useMemo(() => (
    [...alarms].sort((a, b) => {
      const ta = getNextFire(a), tb = getNextFire(b);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta - tb;
    })
  ), [alarms]);

  const nextAlarm    = sortedAlarms.find(a => a.active && getNextFire(a));
  const msUntilNext  = nextAlarm ? getNextFire(nextAlarm) - now : null;
  const greeting     = getGreeting(now.getHours());

  return (
    <>
      {/* ── Header ── */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #1A0A2E 0%, #16162A 100%)',
          px: 2.5, pt: 5, pb: 2.5,
          borderBottom: '1px solid rgba(255,107,53,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient orb */}
        <Box sx={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.11) 0%, transparent 70%)',
          top: -100, right: -70, filter: 'blur(50px)', pointerEvents: 'none',
          '@keyframes homeOrb': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } },
          animation: 'homeOrb 9s ease-in-out infinite',
        }} />

        {/* Brand + clock (no seconds — calmer on mobile) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <WbSunnyIcon sx={{ color: 'primary.main', fontSize: 16 }} />
            <Typography variant="caption" fontWeight={800} color="primary.main" letterSpacing={1.5} fontSize="0.65rem">
              MORNINMATE
            </Typography>
          </Box>
          <Typography fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem' }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>

        {/* Greeting row — name + inline countdown pill */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} noWrap>
              {greeting}, {user.name} ☀️
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
              {user.wakeGoal ? `"${user.wakeGoal}"` : 'Keep that streak alive!'}
            </Typography>
          </Box>
          {nextAlarm && msUntilNext != null && (
            <Box sx={{
              flexShrink: 0,
              px: 1.25, py: 0.5, borderRadius: 2,
              bgcolor: 'rgba(255,107,53,0.1)',
              border: '1px solid rgba(255,107,53,0.2)',
              textAlign: 'center',
            }}>
              <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ display: 'block', lineHeight: 1.2 }}>
                {formatCountdown(msUntilNext)}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                NEXT
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stats + XP */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <StatChip icon={<EmojiEventsIcon sx={{ fontSize: 12 }} />} label={`Lv.${user.level}`}          color="#FF6B35" />
            <StatChip icon={<LocalFireDepartmentIcon sx={{ fontSize: 12 }} />} label={`${user.streak} streak`} color="#FFD166" />
            {user.demerits > 0 && (
              <StatChip icon={<WarningAmberIcon sx={{ fontSize: 12 }} />} label={`${user.demerits} demerits`} color="#EF476F" />
            )}
            <Box sx={{ ml: 'auto' }}>
              <Typography variant="caption" color="primary.main" fontWeight={700} fontSize="0.65rem">
                {xpInLevel}/{XP_PER_LEVEL} XP
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={xpProgress * 100}
            sx={{
              height: 4, borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.07)',
              '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #FF6B35, #FFD166)' },
            }}
          />
        </Box>
      </Box>

      {/* ── Alarm list ── */}
      <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Your Alarms</Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, bgcolor: 'rgba(255,107,53,0.1)', px: 1.25, py: 0.35, borderRadius: 1.5, fontSize: '0.65rem' }}>
            {alarms.filter(a => a.active).length} active
          </Typography>
        </Box>

        {sortedAlarms.length === 0 ? (
          <EmptyState onAdd={() => onNavigate('/create-alarm')} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sortedAlarms.map((alarm, idx) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                isNext={idx === 0 && alarm.active}
                now={now}
                onToggle={()  => toggleAlarm(alarm.id)}
                onDelete={()  => setDeleteTarget(alarm)}
                onEdit={()    => setEditTarget(alarm)}
                onTest={()    => triggerAlarm(alarm)}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── FAB with pulse ring ── */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 20 }}>
        <Box sx={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: '2px solid rgba(255,107,53,0.3)', pointerEvents: 'none',
          '@keyframes fabRing': { '0%': { transform: 'scale(1)', opacity: 0.6 }, '100%': { transform: 'scale(1.6)', opacity: 0 } },
          animation: 'fabRing 2.2s ease-out infinite',
        }} />
        <Fab color="primary" onClick={() => onNavigate('/create-alarm')} sx={{ boxShadow: '0 6px 24px rgba(255,107,53,0.45)' }}>
          <AddIcon />
        </Fab>
      </Box>

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

function AlarmCard({ alarm, isNext, now, onToggle, onDelete, onEdit, onTest }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const pulseColor = PULSE_COLORS[alarm.pulse?.intensity] || '#FF6B35';
  const nextFire   = getNextFire(alarm);
  const minsUntil  = nextFire ? Math.round((nextFire - now) / 60000) : null;
  const countdown  = minsUntil == null ? null
    : minsUntil < 60 ? `in ${minsUntil}m`
    : `in ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;

  function closeMenu() { setMenuAnchor(null); }

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${alarm.active ? pulseColor : 'rgba(255,255,255,0.12)'}`,
        background: alarm.active ? `linear-gradient(90deg, ${pulseColor}08 0%, transparent 30%)` : undefined,
        opacity: alarm.active ? 1 : 0.48,
        transition: 'opacity 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* ── Row 1: label / badge + switch + menu ── */}
      <Box sx={{ px: 2, pt: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          {isNext && alarm.active && (
            <Box sx={{
              px: 0.9, py: 0.15, borderRadius: 1, flexShrink: 0,
              bgcolor: 'rgba(255,107,53,0.15)',
              fontSize: '0.52rem', fontWeight: 900, letterSpacing: 0.8,
              color: 'primary.main', lineHeight: 1.6,
            }}>
              NEXT
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
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
            sx={{ color: 'rgba(255,255,255,0.35)', p: 1, touchAction: 'manipulation' }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Row 2: time + countdown ── */}
      <Box sx={{ px: 2, pb: 0, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
        <Typography
          fontWeight={800}
          sx={{
            fontSize: '2.4rem',
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.5px',
            ...(isNext && alarm.active && {
              '@keyframes nextGlow': {
                '0%,100%': { textShadow: 'none' },
                '50%':     { textShadow: `0 0 22px ${pulseColor}55` },
              },
              animation: 'nextGlow 3s ease-in-out infinite',
            }),
          }}
        >
          {formatTime(alarm.time)}
        </Typography>
        {alarm.active && countdown && (
          <Typography variant="caption" fontWeight={700} sx={{ color: pulseColor, opacity: 0.9, pb: 0.25 }}>
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
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: on ? `${pulseColor}22` : 'rgba(255,255,255,0.05)',
                color: on ? pulseColor : 'rgba(255,255,255,0.22)',
                fontWeight: 700, fontSize: '0.58rem',
                border: on ? `1px solid ${pulseColor}45` : '1px solid transparent',
              }}>
                {d}
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Row 4: pulse info ── */}
      {alarm.pulse && (
        <Box sx={{ px: 2, pt: 1, pb: 1.75, display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Box sx={{
            px: 1.25, py: 0.3, borderRadius: 1.5,
            bgcolor: `${pulseColor}15`, color: pulseColor,
            fontSize: '0.63rem', fontWeight: 700, lineHeight: 1.6,
          }}>
            {PULSE_LABELS[alarm.pulse.intensity]}
          </Box>
          <Box sx={{
            px: 1.25, py: 0.3, borderRadius: 1.5,
            bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)',
            fontSize: '0.63rem', fontWeight: 600, lineHeight: 1.6,
          }}>
            {alarm.pulse.games?.length || 1} game{alarm.pulse.games?.length !== 1 ? 's' : ''}
          </Box>
        </Box>
      )}

      {/* ── Context menu ── */}
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
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      >
        <MenuItem onClick={() => { onTest(); closeMenu(); }} sx={{ gap: 1.5, py: 1.25, fontSize: '0.88rem' }}>
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
    </Card>
  );
}

// ─── Edit Alarm Dialog ────────────────────────────────────────────────────────

function EditAlarmDialog({ alarm, onClose, onSave }) {
  const [label, setLabel] = useState(alarm.label || '');
  const [time,  setTime]  = useState(alarm.time);
  const [days,  setDays]  = useState(alarm.days || []);

  function toggleDay(i) {
    setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { bgcolor: '#1E1E35', borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Edit Alarm</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '8px !important' }}>
        <TextField
          label="Label" value={label} onChange={e => setLabel(e.target.value)}
          fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Time" type="time" value={time} onChange={e => setTime(e.target.value)}
          fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
        />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Repeat on</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {DAY_LABELS.map((d, i) => (
              <Box
                key={i}
                onClick={() => toggleDay(i)}
                sx={{
                  flex: 1, aspectRatio: '1', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: days.includes(i) ? 'primary.main' : 'rgba(255,255,255,0.07)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.68rem',
                  userSelect: 'none', transition: 'background 0.15s',
                  '&:hover': { bgcolor: days.includes(i) ? 'primary.dark' : 'rgba(255,255,255,0.14)' },
                }}
              >
                {d}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ label, time, days })}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { user, alarms, XP_PER_LEVEL } = useApp();
  const xpInLevel    = user.xp % XP_PER_LEVEL;
  const xpToNext     = XP_PER_LEVEL - xpInLevel;
  const activeCount  = alarms.filter(a => a.active).length;
  const inactiveCount = alarms.length - activeCount;
  const gameLabels   = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(160deg, #1A0A2E 0%, #16162A 100%)',
          p: 3, pt: 5, pb: 3,
          borderBottom: '1px solid rgba(255,107,53,0.1)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
          top: -100, right: -60, filter: 'blur(45px)', pointerEvents: 'none',
          '@keyframes statsOrb': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } },
          animation: 'statsOrb 10s ease-in-out infinite',
        }} />
        <Typography variant="h5" fontWeight={800}>Your Stats</Typography>
        <Typography variant="body2" color="text.secondary">Track your progress</Typography>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Level card */}
        <Card sx={{
          p: 3, bgcolor: 'background.paper',
          border: '1px solid rgba(255,107,53,0.15)',
          borderTop: '2px solid rgba(255,107,53,0.5)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              bgcolor: 'primary.main', width: 52, height: 52,
              fontWeight: 800, fontSize: '1.2rem',
              boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
            }}>
              {user.level}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>Level {user.level}</Typography>
              <Typography variant="body2" color="text.secondary">{xpToNext} XP to next level</Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(xpInLevel / XP_PER_LEVEL) * 100}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.07)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
            <Typography variant="caption" color="text.secondary">{xpInLevel} XP</Typography>
            <Typography variant="caption" color="text.secondary">{XP_PER_LEVEL} XP</Typography>
          </Box>
        </Card>

        {/* Metric grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <MetricCard icon="🔥" label="Current Streak" value={user.streak}   unit="days" color="#FFD166" />
          <MetricCard icon="⭐" label="Total XP"        value={user.xp}                  color="#FF6B35" />
          <MetricCard icon="⚠️" label="Demerits"        value={user.demerits}            color="#EF476F" />
          <MetricCard icon="⏰" label="Total Alarms"    value={alarms.length}            color="#06D6A0" />
        </Box>

        {/* Alarm breakdown */}
        <Card sx={{ p: 2.5, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Alarm Breakdown</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{
              flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2,
              bgcolor: 'rgba(6,214,160,0.07)', border: '1px solid rgba(6,214,160,0.18)',
            }}>
              <Typography variant="h4" fontWeight={800} color="#06D6A0">{activeCount}</Typography>
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </Box>
            <Box sx={{
              flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Typography variant="h4" fontWeight={800} color="text.secondary">{inactiveCount}</Typography>
              <Typography variant="caption" color="text.secondary">Inactive</Typography>
            </Box>
          </Box>
        </Card>

        {/* Preferred game */}
        {user.favoriteGame && (
          <Card sx={{ p: 2.5, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Preferred Wake-Up Game
            </Typography>
            <Typography variant="body1" fontWeight={700} color="primary.main">
              {gameLabels[user.favoriteGame] || user.favoriteGame}
            </Typography>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function MetricCard({ icon, label, value, unit, color }) {
  return (
    <Card sx={{
      p: 2, bgcolor: 'background.paper',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: `2px solid ${color}45`,
    }}>
      <Typography sx={{ fontSize: '1.3rem', mb: 0.5 }}>{icon}</Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
        {value}
        {unit && <Typography component="span" variant="caption" color="text.secondary"> {unit}</Typography>}
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Card>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const MORNING_TYPES_PROFILE = [
  { value: 1, emoji: '🦇', label: 'Night Owl' },
  { value: 2, emoji: '😴', label: 'Slow Starter' },
  { value: 3, emoji: '😐', label: 'In Between' },
  { value: 4, emoji: '🌅', label: 'Early Bird' },
  { value: 5, emoji: '⚡', label: 'Morning Person' },
];

const GAMES_PROFILE = [
  { value: 'math',     emoji: '🧮', label: 'Math Blitz' },
  { value: 'memory',   emoji: '🃏', label: 'Memory Match' },
  { value: 'reaction', emoji: '⚡', label: 'Reaction Rush' },
];

function ProfileTab() {
  const { user, resetAll, updateUser } = useApp();
  const [editing,      setEditing]      = useState(false);
  const [draft,        setDraft]        = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const displayInitials = name => (name || 'MM').slice(0, 2).toUpperCase();

  const morningLabel = MORNING_TYPES_PROFILE.find(t => t.value === user.morningRating)?.label || '—';
  const gameLabel    = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' }[user.favoriteGame] || '—';

  function startEdit() {
    setDraft({ name: user.name, wakeTime: user.wakeTime, morningRating: user.morningRating, favoriteGame: user.favoriteGame, wakeGoal: user.wakeGoal || '' });
    setEditing(true);
  }

  function saveEdit() {
    if (!draft.name.trim()) return;
    updateUser(draft);
    setEditing(false);
    setDraft(null);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
  }

  const avatarName = editing ? draft.name : user.name;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #1A0A2E 0%, #16162A 100%)',
          p: 3, pt: 5, pb: 4,
          borderBottom: '1px solid rgba(255,107,53,0.1)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
          top: -80, right: -60, filter: 'blur(40px)', pointerEvents: 'none',
          '@keyframes profOrb': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' } },
          animation: 'profOrb 11s ease-in-out infinite',
        }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 64, height: 64, bgcolor: 'primary.main',
              fontWeight: 800, fontSize: '1.3rem',
              boxShadow: '0 0 0 3px rgba(255,107,53,0.25), 0 0 28px rgba(255,107,53,0.2)',
              transition: 'all 0.3s',
            }}>
              {displayInitials(avatarName)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
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
              sx={{ color: 'rgba(255,255,255,0.45)', bgcolor: 'rgba(255,255,255,0.07)', '&:hover': { bgcolor: 'rgba(255,255,255,0.13)' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {editing ? (
          /* ── Edit form ── */
          <>
            {/* Name */}
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

            {/* Wake time */}
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

            {/* Morning type */}
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
                        border: sel ? '1.5px solid rgba(255,107,53,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                        bgcolor: sel ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'all 0.18s',
                      }}
                    >
                      <Typography sx={{ fontSize: '1.15rem', lineHeight: 1 }}>{type.emoji}</Typography>
                      <Typography variant="body2" fontWeight={sel ? 700 : 400}
                        sx={{ color: sel ? 'primary.main' : 'text.primary' }}>
                        {type.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Preferred game */}
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
                        border: sel ? '1.5px solid rgba(255,107,53,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                        bgcolor: sel ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'all 0.18s',
                      }}
                    >
                      <Typography sx={{ fontSize: '1.15rem', lineHeight: 1 }}>{game.emoji}</Typography>
                      <Typography variant="body2" fontWeight={sel ? 700 : 400}
                        sx={{ color: sel ? 'primary.main' : 'text.primary' }}>
                        {game.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Morning goal */}
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

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
              <Button
                variant="outlined" fullWidth onClick={cancelEdit}
                sx={{ borderRadius: 2, color: 'text.secondary', borderColor: 'rgba(255,255,255,0.15)', '&:hover': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                Cancel
              </Button>
              <Button
                variant="contained" fullWidth onClick={saveEdit}
                disabled={!draft.name.trim()}
                sx={{
                  borderRadius: 2,
                  background: draft.name.trim() ? 'linear-gradient(135deg, #FF6B35, #FF8C5A)' : undefined,
                  boxShadow: draft.name.trim() ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
                }}
              >
                Save Changes
              </Button>
            </Box>
          </>
        ) : (
          /* ── Display mode ── */
          <>
            <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <ProfileRow label="Default wake-up time" value={formatTime(user.wakeTime)} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <ProfileRow label="Morning type"   value={morningLabel} />
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <ProfileRow label="Preferred game" value={gameLabel} />
              {user.wakeGoal && (
                <>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                  <ProfileRow label="Morning goal" value={user.wakeGoal} />
                </>
              )}
            </Card>

            <Button
              variant="outlined" color="error" fullWidth
              onClick={() => setConfirmReset(true)}
              sx={{ mt: 0.5, borderRadius: 2, py: 1.25 }}
            >
              Reset All Data
            </Button>
          </>
        )}

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
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function ConfirmDialog({ open = true, title, body, confirmLabel, confirmColor = 'primary', onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: '#1E1E35', borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{title}</DialogTitle>
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

function StatChip({ icon, label, color }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.5, borderRadius: 10,
      bgcolor: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="caption" fontWeight={600} sx={{ color }}>{label}</Typography>
    </Box>
  );
}

function EmptyState({ onAdd }) {
  return (
    <Card
      sx={{
        p: 4, textAlign: 'center', bgcolor: 'background.paper',
        border: '1px dashed rgba(255,107,53,0.25)',
        '@keyframes emptyFloat': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
      }}
    >
      <Box sx={{ animation: 'emptyFloat 3s ease-in-out infinite', display: 'inline-block', mb: 2 }}>
        <Typography variant="h2">⏰</Typography>
      </Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>No alarms yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create your first alarm and start your morning routine
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>Create Alarm</Button>
    </Card>
  );
}
