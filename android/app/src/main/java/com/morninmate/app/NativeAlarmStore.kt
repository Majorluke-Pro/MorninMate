package com.morninmate.app

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

object NativeAlarmStore {
    private const val PREFS_NAME = "MorninMateAlarms"
    private const val DEFAULT_SOUND = "gentle_chime"
    private var savedAlarmVolume = -1

    fun data(context: Context): NativeAlarmsData {
        val alarms = alarms(context)
        return NativeAlarmsData(
            userName = "Mate",
            defaultWakeTime = "07:00",
            wakeGoal = "",
            favoriteGame = "math",
            streak = prefs(context).getInt("streak", 0),
            xp = prefs(context).getInt("xp", 0),
            xpPerLevel = 100,
            xpProgress = (prefs(context).getInt("xp", 0) % 100) / 100f,
            demerits = prefs(context).getInt("demerits", 0),
            exactAlarmReady = canScheduleExactAlarms(context),
            alarms = alarms.map { it.toNativeAlarmItem() },
        )
    }

    fun stats(context: Context): StatsData {
        val alarms = alarms(context)
        val xp = prefs(context).getInt("xp", 0)
        return StatsData(
            level = (xp / 100) + 1,
            xp = xp,
            xpPerLevel = 100,
            streak = prefs(context).getInt("streak", 0),
            demerits = prefs(context).getInt("demerits", 0),
            alarmsCount = alarms.size,
            activeAlarmsCount = alarms.count { it.optBoolean("active", true) },
            successCount = prefs(context).getInt("successCount", 0),
            failedCount = prefs(context).getInt("failedCount", 0),
        )
    }

    fun profile(context: Context): ProfileData {
        val alarms = alarms(context)
        val xp = prefs(context).getInt("xp", 0)
        return ProfileData(
            userName = "Mate",
            level = (xp / 100) + 1,
            xp = xp,
            xpPerLevel = 100,
            streak = prefs(context).getInt("streak", 0),
            alarmsCount = alarms.size,
            exactAlarmReady = canScheduleExactAlarms(context),
        )
    }

    fun save(context: Context, alarm: JSONObject, existingId: String? = null): JSONObject {
        val id = existingId?.takeIf { it.isNotBlank() }
            ?: alarm.optString("id").takeIf { it.isNotBlank() }
            ?: System.currentTimeMillis().toString()
        alarm.put("id", id)
        if (!alarm.has("active")) alarm.put("active", true)
        prefs(context).edit().putString("alarm_$id", alarm.toString()).apply()
        if (alarm.optBoolean("active", true)) {
            schedule(context, alarm)
        } else {
            cancelScheduled(context, id)
        }
        return alarm
    }

    fun delete(context: Context, alarmId: String) {
        cancelScheduled(context, alarmId)
        prefs(context).edit().remove("alarm_$alarmId").apply()
    }

    fun toggle(context: Context, alarmId: String) {
        val alarm = alarm(context, alarmId) ?: return
        val nextActive = !alarm.optBoolean("active", true)
        setActive(context, alarmId, nextActive)
    }

    fun setActive(context: Context, alarmId: String, active: Boolean): Boolean {
        val alarm = alarm(context, alarmId) ?: return false
        val wasActive = alarm.optBoolean("active", true)
        if (wasActive == active) return true

        alarm.put("active", active)
        if (active) {
            val scheduled = schedule(context, alarm)
            if (!scheduled) {
                alarm.put("active", false)
                prefs(context).edit().putString("alarm_$alarmId", alarm.toString()).apply()
                return false
            }
        } else {
            cancelScheduled(context, alarmId)
        }
        prefs(context).edit().putString("alarm_$alarmId", alarm.toString()).apply()
        return true
    }

    fun test(context: Context, alarmId: String) {
        val alarm = alarm(context, alarmId) ?: return
        val intent = Intent(context, AlarmService::class.java)
            .putExtra("alarmId", alarmId)
            .putExtra("label", alarm.optString("label", "Alarm"))
            .putExtra("sound", alarm.optString("sound", DEFAULT_SOUND))
            .putExtra("previewMs", -1)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    fun dismissAlarm(context: Context, alarmId: String?) {
        cancelNagAlarm(context, alarmId)
        context.stopService(Intent(context, AlarmService::class.java))
        prefs(context).edit().remove("pending_alarm").apply()
        disableHardcoreLock(context)
    }

    fun logOff(context: Context) {
        prefs(context).edit()
            .remove("pending_alarm")
            .remove("userName")
            .apply()
        disableHardcoreLock(context)
    }

    fun deleteData(context: Context) {
        alarms(context).forEach { alarm ->
            val id = alarm.optString("id")
            if (id.isNotBlank()) cancelScheduled(context, id)
        }
        context.stopService(Intent(context, AlarmService::class.java))
        prefs(context).edit().clear().apply()
        disableHardcoreLock(context)
    }

    fun requestAlarmPermissions(activity: android.app.Activity) {
        val context = activity.applicationContext
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExactAlarms(context)) {
            try {
                activity.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:${context.packageName}")
                })
            } catch (_: Exception) {
                openAppSettings(context)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !NotificationManagerCompat.from(context).areNotificationsEnabled()
        ) {
            ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (!nm.canUseFullScreenIntent()) {
                try {
                    activity.startActivity(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                        data = Uri.parse("package:${context.packageName}")
                    })
                } catch (_: Exception) {
                    openAppSettings(context)
                }
            }
        }

        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(context.packageName)) {
            try {
                activity.startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                })
            } catch (_: Exception) {
                openAppSettings(context)
            }
        }
    }

    fun enableHardcoreLock(context: Context) {
        MainActivity.isHardcoreLocked = true
        val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        savedAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM)
        audio.setStreamVolume(AudioManager.STREAM_ALARM, audio.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            audio.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_UNMUTE, 0)
        }
        val intent = Intent(context, HardcoreGuardService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
    }

    fun disableHardcoreLock(context: Context) {
        MainActivity.isHardcoreLocked = false
        context.stopService(Intent(context, HardcoreGuardService::class.java))
        if (savedAlarmVolume >= 0) {
            val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audio.setStreamVolume(AudioManager.STREAM_ALARM, savedAlarmVolume, 0)
            savedAlarmVolume = -1
        }
    }

    private fun schedule(context: Context, alarm: JSONObject): Boolean {
        val id = alarm.optString("id")
        val time = alarm.optString("time", "07:00").split(":")
        val hour = time.getOrNull(0)?.toIntOrNull() ?: 7
        val minute = time.getOrNull(1)?.toIntOrNull() ?: 0
        val days = alarm.optJSONArray("days") ?: JSONArray()
        return if (days.length() == 0) {
            scheduleOne(context, id, alarm.optString("label", "Alarm"), alarm.optString("sound", DEFAULT_SOUND), hour, minute, -1, false, 0)
        } else {
            var scheduled = true
            for (i in 0 until days.length()) {
                scheduled = scheduleOne(context, id, alarm.optString("label", "Alarm"), alarm.optString("sound", DEFAULT_SOUND), hour, minute, days.optInt(i), true, i + 1) && scheduled
            }
            scheduled
        }
    }

    private fun scheduleOne(
        context: Context,
        alarmId: String,
        label: String,
        sound: String,
        hour: Int,
        minute: Int,
        targetDay: Int,
        repeating: Boolean,
        codeIndex: Int,
    ): Boolean {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) return false
        val intent = Intent(context, AlarmReceiver::class.java)
            .putExtra("alarmId", alarmId)
            .putExtra("label", label)
            .putExtra("sound", sound)
            .putExtra("hour", hour)
            .putExtra("minute", minute)
            .putExtra("repeating", repeating)
            .putExtra("targetDay", targetDay)
        val pi = PendingIntent.getBroadcast(
            context,
            AlarmReceiver.requestCode(alarmId, codeIndex),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextOccurrence(hour, minute, targetDay), pi)
        return true
    }

    private fun cancelScheduled(context: Context, alarmId: String) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        for (i in 0..7) {
            val pi = PendingIntent.getBroadcast(
                context,
                AlarmReceiver.requestCode(alarmId, i),
                Intent(context, AlarmReceiver::class.java),
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
            )
            if (pi != null) {
                am.cancel(pi)
                pi.cancel()
            }
        }
        cancelNagAlarm(context, alarmId)
    }

    private fun cancelNagAlarm(context: Context, alarmId: String?) {
        if (alarmId.isNullOrBlank()) return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = PendingIntent.getBroadcast(
            context,
            AlarmService.nagRequestCode(alarmId),
            Intent(context, NagAlarmReceiver::class.java),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
        if (pi != null) {
            am.cancel(pi)
            pi.cancel()
        }
    }

    private fun alarms(context: Context): List<JSONObject> =
        prefs(context).all.entries
            .filter { it.key.startsWith("alarm_") && it.value is String }
            .mapNotNull { entry ->
                runCatching {
                    JSONObject(entry.value as String).apply {
                        if (optString("id").isBlank()) {
                            put("id", entry.key.removePrefix("alarm_"))
                        }
                    }
                }.getOrNull()
            }
            .sortedBy { it.optString("time", "99:99") }

    private fun alarm(context: Context, alarmId: String): JSONObject? =
        prefs(context).getString("alarm_$alarmId", null)?.let { runCatching { JSONObject(it) }.getOrNull() }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun canScheduleExactAlarms(context: Context): Boolean {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
    }

    private fun nextOccurrence(hour: Int, minute: Int, targetDay: Int): Long {
        val cal = Calendar.getInstance().apply {
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
        }
        if (targetDay < 0) {
            if (cal.timeInMillis <= System.currentTimeMillis()) cal.add(Calendar.DAY_OF_YEAR, 1)
            return cal.timeInMillis
        }
        val today = cal.get(Calendar.DAY_OF_WEEK) - 1
        val daysUntil = (targetDay - today + 7) % 7
        cal.add(Calendar.DAY_OF_YEAR, daysUntil)
        if (cal.timeInMillis <= System.currentTimeMillis()) cal.add(Calendar.DAY_OF_YEAR, 7)
        return cal.timeInMillis
    }

    private fun JSONObject.toNativeAlarmItem(): NativeAlarmItem {
        val pulse = optJSONObject("pulse") ?: JSONObject()
        val daysJson = optJSONArray("days") ?: JSONArray()
        val days = List(daysJson.length()) { daysJson.optInt(it) }
        return NativeAlarmItem(
            id = optString("id"),
            label = optString("label", "Alarm"),
            time = optString("time", "07:00"),
            active = optBoolean("active", true),
            days = days,
            intensity = pulse.optString("intensity", "gentle"),
            games = pulse.optJSONArray("games")?.length() ?: 1,
            rawJson = toString(),
        )
    }

    private fun openAppSettings(context: Context) {
        try {
            context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
        }
    }
}
