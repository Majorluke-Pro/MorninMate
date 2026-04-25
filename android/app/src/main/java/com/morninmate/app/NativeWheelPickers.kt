package com.morninmate.app

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import dev.darkokoa.datetimewheelpicker.WheelTimePicker as DarkWheelTimePicker
import dev.darkokoa.datetimewheelpicker.core.SelectorProperties
import dev.darkokoa.datetimewheelpicker.core.TimeFormat as DarkTimeFormat
import dev.darkokoa.datetimewheelpicker.core.WheelPickerDefaults
import kotlinx.datetime.LocalTime

enum class TimeFormat {
    HOUR_24,
    AM_PM,
}

data class TimeFormatter(val timeFormat: TimeFormat)

fun timeFormatter(timeFormat: TimeFormat = TimeFormat.HOUR_24): TimeFormatter =
    TimeFormatter(timeFormat)

@Composable
fun WheelTimePicker(
    modifier: Modifier = Modifier,
    startTime: LocalTime,
    timeFormatter: TimeFormatter,
    size: DpSize = DpSize(128.dp, 128.dp),
    rowCount: Int = 3,
    textStyle: TextStyle,
    textColor: Color,
    selectorProperties: SelectorProperties = WheelPickerDefaults.selectorProperties(),
    onSnappedTime: (snappedTime: LocalTime) -> Unit = {},
) {
    DarkWheelTimePicker(
        modifier = modifier,
        startTime = startTime,
        timeFormat = when (timeFormatter.timeFormat) {
            TimeFormat.HOUR_24 -> DarkTimeFormat.HOUR_24
            TimeFormat.AM_PM -> DarkTimeFormat.AM_PM
        },
        size = size,
        rowCount = rowCount,
        textStyle = textStyle,
        textColor = textColor,
        selectorProperties = selectorProperties,
        onSnappedTime = onSnappedTime,
    )
}
