/**
 * nativeAlarms.js
 * Wraps @capacitor/local-notifications for scheduling real device alarms.
 * Falls back gracefully on web (no-ops).
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!isNative) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    return;
  }
  const { display } = await LocalNotifications.requestPermissions();
  return display; // 'granted' | 'denied'
}

// ─── ID helpers ───────────────────────────────────────────────────────────────
// LocalNotifications requires integer IDs. We derive a stable int from the
// alarm UUID + day index so each alarm×day gets its own notification slot.

function notifId(alarmId, dayIndex = 0) {
  // Hash the UUID into a positive int32
  let hash = 0;
  for (let i = 0; i < alarmId.length; i++) {
    hash = (Math.imul(31, hash) + alarmId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) * 10 + dayIndex;
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

function nextOccurrence(hh, mm, targetDay) {
  // targetDay: 0–6 (Sun–Sat), or null for "next occurrence regardless of day"
  const now = new Date();
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setHours(hh, mm);

  if (targetDay === null) {
    // Just next time this HH:MM fires
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  // Find next occurrence of targetDay at HH:MM
  const daysUntil = (targetDay - now.getDay() + 7) % 7;
  candidate.setDate(candidate.getDate() + daysUntil);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
  return candidate;
}

// ─── Cancel all notifications for an alarm ────────────────────────────────────

export async function cancelAlarmNotifications(alarmId) {
  if (!isNative) return;
  try {
    const ids = Array.from({ length: 8 }, (_, i) => ({ id: notifId(alarmId, i) }));
    await LocalNotifications.cancel({ notifications: ids });
  } catch (_) {}
}

// ─── Schedule notifications for a single alarm ────────────────────────────────

export async function scheduleAlarm(alarm) {
  if (!isNative || !alarm.active) return;

  await cancelAlarmNotifications(alarm.id);

  const [hh, mm] = alarm.time.split(':').map(Number);
  const title = 'MorninMate 🐨';
  const body = alarm.label ? `${alarm.label} — Rise & Shine, Legend!` : "Rise & Shine, Legend! Time to wake up!";

  const notifications = [];

  if (!alarm.days || alarm.days.length === 0) {
    // One-shot: next occurrence of this time
    notifications.push({
      id: notifId(alarm.id, 0),
      title,
      body,
      schedule: { at: nextOccurrence(hh, mm, null), allowWhileIdle: true },
      extra: { alarmId: alarm.id },
      sound: null,
      actionTypeId: '',
    });
  } else {
    // Recurring: one notification per active weekday, repeating weekly
    alarm.days.forEach((day, i) => {
      notifications.push({
        id: notifId(alarm.id, i + 1),
        title,
        body,
        schedule: {
          at: nextOccurrence(hh, mm, day),
          repeats: true,
          every: 'week',
          allowWhileIdle: true,
        },
        extra: { alarmId: alarm.id },
        sound: null,
        actionTypeId: '',
      });
    });
  }

  try {
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn('Failed to schedule native alarm:', e);
  }
}

// ─── Sync all alarms (call after loading from Supabase) ───────────────────────

export async function syncAllAlarms(alarms) {
  if (!isNative) return;

  for (const alarm of alarms) {
    if (alarm.active) {
      await scheduleAlarm(alarm);
    } else {
      await cancelAlarmNotifications(alarm.id);
    }
  }
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

export async function vibrateAlarm() {
  if (!isNative) return;
  try {
    // Pulse pattern for alarm feel
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 600);
  } catch (_) {}
}

export async function vibrateSuccess() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (_) {}
}

// ─── Notification tap listener ────────────────────────────────────────────────
// Returns an unsubscribe function. Call this once on app init.

export function onNotificationTap(callback) {
  if (!isNative) return () => {};
  const listener = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    ({ notification }) => {
      const alarmId = notification.extra?.alarmId;
      if (alarmId) callback(alarmId);
    }
  );
  return () => listener.then(l => l.remove());
}
