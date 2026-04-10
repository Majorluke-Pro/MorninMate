/**
 * nativeAlarms.js
 * Wraps the native AlarmPlugin for scheduling exact Android alarms.
 * Falls back gracefully on web (no-ops).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

const AlarmPlugin = registerPlugin('AlarmPlugin');

// ─── Permissions ─────────────────────────────────────────────────────────────
// On Android 13+, POST_NOTIFICATIONS is auto-prompted when the first
// notification is posted. No manual JS request needed.

export async function requestNotificationPermission() {
  if (!isNative) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleAlarm(alarm) {
  if (!isNative || !alarm.active) return;
  await cancelAlarmNotifications(alarm.id);
  try {
    await AlarmPlugin.schedule({
      id:    String(alarm.id),
      label: alarm.label || '',
      time:  alarm.time,
      days:  alarm.days || [],
    });
  } catch (e) {
    console.warn('Failed to schedule alarm:', e);
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelAlarmNotifications(alarmId) {
  if (!isNative) return;
  try {
    await AlarmPlugin.cancel({ id: String(alarmId) });
  } catch (_) {}
}

// ─── Sync all (called after loading alarms from Supabase) ─────────────────────

export async function syncAllAlarms(alarms) {
  if (!isNative) return;
  for (const alarm of alarms) {
    if (alarm.active) await scheduleAlarm(alarm);
    else await cancelAlarmNotifications(alarm.id);
  }
}

// ─── Pending alarm (cold-start detection) ─────────────────────────────────────
// Returns the ID of an alarm that fired while the app was closed, then clears it.
// Call once after alarms are loaded in AppContext.

export async function getPendingAlarm() {
  if (!isNative) return null;
  try {
    const { alarmId } = await AlarmPlugin.getPendingAlarm();
    return alarmId || null;
  } catch (_) {
    return null;
  }
}

// ─── Dismiss (stops AlarmService: ringtone + WakeLock) ────────────────────────

export async function dismissAlarm(id) {
  if (!isNative) return;
  try {
    await AlarmPlugin.dismissAlarm({ id: String(id) });
  } catch (_) {}
}

// ─── Alarm permissions (USE_FULL_SCREEN_INTENT, battery opt, notifications) ────

export async function checkAndRequestAlarmPermissions() {
  if (!isNative) return;
  try {
    const result = await AlarmPlugin.checkAlarmPermissions();
    const needsRequest = !result.postNotifications
      || !result.fullScreenIntent
      || !result.batteryOptimization;
    if (needsRequest) await AlarmPlugin.requestAlarmPermissions();
  } catch (e) {
    console.warn('checkAndRequestAlarmPermissions failed:', e);
  }
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

export async function vibrateAlarm() {
  if (!isNative) return;
  try {
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
// No-op — alarm firing is now handled via AlarmPlugin.getPendingAlarm()
// (cold start) and the 'alarmFired' document event (backgrounded app).

export function onNotificationTap() {
  return () => {};
}

// ─── Hardcore Mode ────────────────────────────────────────────────────────────

export async function setHardcoreVolume() {
  if (!isNative) return;
  try { await AlarmPlugin.setHardcoreVolume(); } catch (_) {}
}

export async function enableHardcoreLock() {
  if (!isNative) return;
  try { await AlarmPlugin.enableHardcoreLock(); } catch (_) {}
}

export async function disableHardcoreLock() {
  if (!isNative) return;
  try { await AlarmPlugin.disableHardcoreLock(); } catch (_) {}
}
