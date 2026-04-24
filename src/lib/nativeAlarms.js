import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

const AlarmPlugin = registerPlugin('AlarmPlugin');

export async function requestNotificationPermission() {
  if (!isNative) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
  }
}

export async function scheduleAlarm(alarm) {
  if (!isNative || !alarm.active) return;
  await cancelAlarmNotifications(alarm.id);
  try {
    await AlarmPlugin.schedule({
      id: String(alarm.id),
      label: alarm.label || '',
      time: alarm.time,
      days: alarm.days || [],
      sound: alarm.sound || 'gentle_chime',
    });
  } catch (e) {
    console.warn('Failed to schedule alarm:', e);
  }
}

export async function cancelAlarmNotifications(alarmId) {
  if (!isNative) return;
  try {
    await AlarmPlugin.cancel({ id: String(alarmId) });
  } catch {}
}

export async function syncAllAlarms(alarms) {
  if (!isNative) return;
  for (const alarm of alarms) {
    if (alarm.active) await scheduleAlarm(alarm);
    else await cancelAlarmNotifications(alarm.id);
  }
}

export async function getPendingAlarm() {
  if (!isNative) return null;
  try {
    const { alarmId } = await AlarmPlugin.getPendingAlarm();
    return alarmId || null;
  } catch {
    return null;
  }
}

export async function dismissAlarm(id) {
  if (!isNative) return;
  try {
    await AlarmPlugin.dismissAlarm({ id: String(id) });
  } catch {}
}

export async function startAlarmPlayback(sound, id = '', label = 'Alarm') {
  if (!isNative) return;
  try {
    await AlarmPlugin.startPlayback({
      id: String(id),
      label,
      sound: sound || 'gentle_chime',
    });
  } catch {}
}

export async function stopAlarmPlayback() {
  if (!isNative) return;
  try {
    await AlarmPlugin.stopPlayback();
  } catch {}
}

export async function previewSound(sound, durationMs = 3000) {
  if (!isNative) return;
  try {
    await AlarmPlugin.previewSound({
      sound: sound || 'gentle_chime',
      durationMs,
    });
  } catch {}
}

export async function openRingtonePicker() {
  if (!isNative) return null;
  try {
    const result = await AlarmPlugin.openRingtonePicker();
    return result?.uri ? result : null;
  } catch {
    return null;
  }
}

export async function openNativeCreateAlarm(options = {}) {
  if (!isNative) return null;
  try {
    const result = await AlarmPlugin.openNativeCreateAlarm({
      defaultTime: options.defaultTime,
    });
    return result?.time ? result : null;
  } catch (e) {
    console.warn('openNativeCreateAlarm failed:', e);
    return null;
  }
}

export async function setNativeBottomNavVisible(visible) {
  if (!isNative) return;
  try {
    await AlarmPlugin.setNativeBottomNavVisible({ visible: Boolean(visible) });
  } catch {}
}

export async function checkAndRequestAlarmPermissions() {
  if (!isNative) return null;
  try {
    const result = await getAlarmPermissionStatus();
    const needsRequest =
      !result.exactAlarm ||
      !result.postNotifications ||
      !result.fullScreenIntent ||
      !result.batteryOptimization;
    if (needsRequest) await requestAlarmPermissions();
    return getAlarmPermissionStatus();
  } catch (e) {
    console.warn('checkAndRequestAlarmPermissions failed:', e);
    return null;
  }
}

export async function getAlarmPermissionStatus() {
  if (!isNative) {
    return {
      isNative: false,
      exactAlarm: true,
      postNotifications: typeof Notification === 'undefined' || Notification.permission === 'granted',
      fullScreenIntent: true,
      batteryOptimization: true,
    };
  }
  return AlarmPlugin.checkAlarmPermissions().then(r => ({ isNative: true, ...r }));
}

export async function requestAlarmPermissions() {
  if (!isNative) return null;
  await AlarmPlugin.requestAlarmPermissions();
  return getAlarmPermissionStatus();
}

export async function vibrateAlarm() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 600);
  } catch {}
}

export async function vibrateSuccess() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export function onNotificationTap() {
  return () => {};
}

export async function setHardcoreVolume() {
  if (!isNative) return;
  try {
    await AlarmPlugin.setHardcoreVolume();
  } catch {}
}

export async function enableHardcoreLock() {
  if (!isNative) return;
  try {
    await AlarmPlugin.enableHardcoreLock();
  } catch {}
}

export async function disableHardcoreLock() {
  if (!isNative) return;
  try {
    await AlarmPlugin.disableHardcoreLock();
  } catch {}
}
