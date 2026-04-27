package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Cake
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalCafe
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.NightsStay
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.WbTwilight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar
import java.util.Locale

private val ObBg = Color(0xFF111827)
private val ObCard = Color(0xFF1E2533)
private val ObInput = Color(0xFF111827)
private val ObBorder = Color(0xFF2D3748)
private val ObMuted = Color(0xFF6B7280)
private val ObText = Color(0xFFF9FAFB)
private val ObDawn = Color(0xFFFF6B35)
private val ObMint = Color(0xFF06D6A0)
private val ObGold = Color(0xFFFFD166)
private val ObBlue = Color(0xFF60A5FA)
private val ObPurple = Color(0xFFA78BFA)

private val stepIds = listOf("welcome", "wakeTime", "morningType", "game", "goal", "name", "age", "country", "avatar", "summary")

private data class MorningType(val value: Int, val icon: ImageVector, val label: String, val desc: String)
private data class OnboardingGameOption(val id: String, val icon: ImageVector, val label: String, val desc: String, val tag: String, val color: Color)
private data class PresetOption(val label: String, val icon: ImageVector)
private data class AvatarOption(val id: String, val label: String, val icon: ImageVector, val color: Color)

private val morningTypes = listOf(
    MorningType(1, Icons.Default.NightsStay, "Night Owl", "Mornings are your nemesis"),
    MorningType(2, Icons.Default.Alarm, "Slow Starter", "Need a few coffees to function"),
    MorningType(3, Icons.Default.WbSunny, "In Between", "Neither early nor late"),
    MorningType(4, Icons.Default.WbTwilight, "Early Bird", "You enjoy the quiet morning"),
    MorningType(5, Icons.Default.Bolt, "Morning Person", "Up at 5am, annoyingly alive"),
)

private val gameOptions = listOf(
    OnboardingGameOption("math", Icons.Default.Calculate, "Math Blitz", "Solve quick arithmetic to dismiss", "Brain", ObDawn),
    OnboardingGameOption("memory", Icons.Default.Style, "Memory Match", "Flip and match pairs", "Visual", ObGold),
    OnboardingGameOption("reaction", Icons.Default.Bolt, "Reaction Rush", "Tap right on cue - no cheating", "Reflex", ObMint),
)

private val goalPresets = listOf(
    PresetOption("Gym session", Icons.Default.FitnessCenter),
    PresetOption("Study time", Icons.Default.MenuBook),
    PresetOption("Meditate", Icons.Default.SelfImprovement),
    PresetOption("Slow morning", Icons.Default.LocalCafe),
    PresetOption("Morning run", Icons.Default.DirectionsRun),
    PresetOption("Journaling", Icons.Default.TrackChanges),
)

private fun getCountries(): ArrayList<String> {
    val isoCountryCodes = Locale.getISOCountries()
    val countriesWithEmojis: ArrayList<String> = arrayListOf()
    for (countryCode in isoCountryCodes) {
        val locale = Locale("", countryCode)
        val countryName = locale.displayCountry
        if (countryName.isBlank()) continue
        val flagOffset = 0x1F1E6
        val asciiOffset = 0x41
        val firstChar = countryCode[0].code - asciiOffset + flagOffset
        val secondChar = countryCode[1].code - asciiOffset + flagOffset
        val flag = String(Character.toChars(firstChar)) + String(Character.toChars(secondChar))
        countriesWithEmojis.add("$countryName $flag")
    }
    countriesWithEmojis.sort()
    return countriesWithEmojis
}

private val avatarOptions = listOf(
    AvatarOption("bolt", "Bolt", Icons.Default.Bolt, ObDawn),
    AvatarOption("sun", "Sun", Icons.Default.WbSunny, ObGold),
    AvatarOption("focus", "Focus", Icons.Default.TrackChanges, ObMint),
    AvatarOption("mind", "Mind", Icons.Default.Psychology, ObPurple),
    AvatarOption("run", "Run", Icons.Default.DirectionsRun, ObBlue),
    AvatarOption("face", "Face", Icons.Default.Face, ObDawn),
)

private var nativeOnboardingView: ComposeView? = null
private var nativeOnboardingActivity: ComponentActivity? = null
private val onboardingResetToken = mutableStateOf(0)

fun setupNativeOnboardingScreen(activity: ComponentActivity) {
    nativeOnboardingActivity = activity
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    nativeOnboardingView?.let { root.removeView(it) }
    val composeView = ComposeView(activity).apply {
        isClickable = true
        visibility = View.GONE
        elevation = 90f
        translationZ = 90f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            key(onboardingResetToken.value) {
                NativeOnboardingScreen { data ->
                    (nativeOnboardingActivity as? MainActivity)?.completeNativeOnboarding(
                        data.name,
                        data.wakeTime,
                        data.favoriteGame,
                        data.morningRating,
                        data.wakeGoal,
                        data.age,
                        data.country,
                        data.profileIcon,
                    )
                }
            }
        }
    }
    root.addView(
        composeView,
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ),
    )
    nativeOnboardingView = composeView
}

fun setNativeOnboardingVisible(visible: Boolean) {
    nativeOnboardingView?.post {
        nativeOnboardingView?.visibility = if (visible) View.VISIBLE else View.GONE
    }
}

fun resetNativeOnboardingScreen() {
    onboardingResetToken.value += 1
}

private data class OnboardingData(
    val name: String,
    val age: String,
    val country: String,
    val wakeTime: String,
    val morningRating: Int,
    val favoriteGame: String,
    val wakeGoal: String,
    val profileIcon: String,
)

@Composable
private fun NativeOnboardingScreen(onComplete: (OnboardingData) -> Unit) {
    val initialBirthYear = remember { (Calendar.getInstance().get(Calendar.YEAR) - 25).toString() }
    var step by remember { mutableStateOf(0) }
    var name by remember { mutableStateOf("") }
    var age by remember { mutableStateOf(initialBirthYear) }
    var country by remember { mutableStateOf("") }
    var wakeTime by remember { mutableStateOf("07:00") }
    var morningRating by remember { mutableStateOf(3) }
    var favoriteGame by remember { mutableStateOf("math") }
    var wakeGoal by remember { mutableStateOf("") }
    var profileIcon by remember { mutableStateOf("bolt") }

    val current = stepIds[step]
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val canContinue = when (current) {
        "name" -> name.trim().length >= 2
        "age" -> age.toIntOrNull()?.let { it in (currentYear - 100)..currentYear } == true
        "country" -> country.trim().length >= 2
        "goal" -> wakeGoal.trim().isNotBlank()
        else -> true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ObBg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        Header(step = step, onBack = { if (step > 0) step -= 1 })
        if (current != "welcome") DotsProgress(step = (step - 1).coerceAtLeast(0), total = stepIds.size - 1)
        Box(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 24.dp, vertical = 8.dp),
            contentAlignment = if (current == "welcome") Alignment.Center else Alignment.TopCenter,
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = ObCard,
                border = BorderStroke(1.dp, Color(0xFF262F40)),
            ) {
                Column(
                    modifier = Modifier
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 18.dp, vertical = 22.dp),
                ) {
                    when (current) {
                        "welcome" -> WelcomeStep()
                        "wakeTime" -> WakeTimeStep(wakeTime) { wakeTime = it }
                        "morningType" -> MorningTypeStep(morningRating) { morningRating = it }
                        "game" -> GameStep(favoriteGame) { favoriteGame = it }
                        "goal" -> GoalStep(wakeGoal) { wakeGoal = it }
                        "name" -> TextInputStep(Icons.Default.Person, "Step 5", "Choose your display name", "This is how MorninMate will greet you", "Enter display name...", name, false) { name = it.take(30) }
                        "age" -> BirthYearStep(age) { age = it }
                        "country" -> CountryStep(country) { country = it }
                        "avatar" -> AvatarStep(profileIcon) { profileIcon = it }
                        "summary" -> SummaryStep(
                            OnboardingData(name, age, country, wakeTime, morningRating, favoriteGame, wakeGoal, profileIcon),
                        )
                    }
                }
            }
        }
        Button(
            onClick = {
                if (!canContinue) return@Button
                if (current == "summary") {
                    onComplete(OnboardingData(name, age, country, wakeTime, morningRating, favoriteGame, wakeGoal, profileIcon))
                } else {
                    step += 1
                }
            },
            enabled = canContinue,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 24.dp)
                .height(56.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = ObDawn,
                disabledContainerColor = Color(0xFF374151),
                disabledContentColor = Color(0xFF9CA3AF),
            ),
        ) {
            Text(
                when (current) {
                    "welcome" -> "Get Started"
                    "summary" -> "Start Using MorninMate"
                    else -> "Continue"
                },
                color = Color.White,
                fontWeight = FontWeight.Black,
                letterSpacing = 0.8.sp,
            )
        }
    }
}

@Composable
private fun Header(step: Int, onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.CenterStart) {
            if (step > 0) {
                IconButton(onClick = onBack, modifier = Modifier.size(36.dp)) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color(0xFF9CA3AF), modifier = Modifier.size(20.dp))
                }
            }
        }
        Text("MorninMate", color = ObDawn, fontSize = 16.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
        Spacer(Modifier.size(36.dp))
    }
}

@Composable
private fun DotsProgress(step: Int, total: Int) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(7.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
    ) {
        Spacer(Modifier.weight(1f))
        repeat(total) { index ->
            val active = index == step
            val done = index < step
            Box(
                Modifier
                    .size(if (active) 8.dp else 6.dp)
                    .background(if (active || done) ObDawn else Color(0xFF1F2937), CircleShape),
            )
        }
        Spacer(Modifier.weight(1f))
    }
}

@Composable
private fun WelcomeStep() {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(18.dp), modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .size(128.dp)
                .background(Color(0xFF111827), RoundedCornerShape(34.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Alarm, contentDescription = null, tint = ObDawn, modifier = Modifier.size(70.dp))
        }
        Text("Wake up.\nLevel up.", color = ObText, fontSize = 38.sp, lineHeight = 40.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
        Text("We'll dial in your mornings first, then finish your profile at the end.", color = ObMuted, fontSize = 14.sp, lineHeight = 21.sp, textAlign = TextAlign.Center)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            WelcomePill(Icons.Default.Alarm, "Alarm setup")
            WelcomePill(Icons.Default.SportsEsports, "Mini-games")
            WelcomePill(Icons.Default.Bolt, "Streaks")
        }
    }
}

@Composable
private fun WelcomePill(icon: ImageVector, label: String) {
    Surface(shape = RoundedCornerShape(20.dp), color = ObInput, border = BorderStroke(1.dp, ObBorder)) {
        Row(Modifier.padding(horizontal = 10.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            Icon(icon, contentDescription = null, tint = ObDawn, modifier = Modifier.size(13.dp))
            Text(label, color = Color(0xFF9CA3AF), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun StepHeader(icon: ImageVector, eyebrow: String, title: String, subtitle: String) {
    Text(eyebrow, color = ObDawn, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
    Spacer(Modifier.height(8.dp))
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(36.dp).background(ObDawn, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(19.dp))
        }
        Text(title, color = ObText, fontSize = 21.sp, fontWeight = FontWeight.Black, lineHeight = 24.sp)
    }
    Spacer(Modifier.height(8.dp))
    Text(subtitle, color = ObMuted, fontSize = 13.sp, lineHeight = 19.sp)
    Spacer(Modifier.height(18.dp))
}

@Composable
private fun WakeTimeStep(value: String, onChange: (String) -> Unit) {
    val parts = value.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 7
    val minute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0
    val context = LocalContext.current

    StepHeader(Icons.Default.Alarm, "Step 1", "When do you wake up?", "Let's start with your target alarm time")
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                android.app.TimePickerDialog(context, { _, h, m ->
                    onChange("%02d:%02d".format(h, m))
                }, hour, minute, false).show()
            },
        shape = RoundedCornerShape(18.dp),
        color = ObInput,
        border = BorderStroke(1.dp, ObDawn.copy(alpha = 0.45f)),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Alarm, contentDescription = null, tint = ObDawn, modifier = Modifier.size(28.dp))
                Spacer(Modifier.size(14.dp))
                Text(formatTime(value), color = ObText, fontSize = 32.sp, fontWeight = FontWeight.Black)
            }
            Spacer(Modifier.height(8.dp))
            Text("Tap to change", color = ObMuted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun MorningTypeStep(selected: Int, onSelect: (Int) -> Unit) {
    StepHeader(Icons.Default.Person, "Step 2", "What kind of morning person are you?", "Be honest and we'll shape the wake-up experience around it")
    ChoiceList {
        morningTypes.forEach {
            SelectRow(it.label, it.desc, it.icon, ObDawn, selected == it.value) { onSelect(it.value) }
        }
    }
}

@Composable
private fun GameStep(selected: String, onSelect: (String) -> Unit) {
    StepHeader(Icons.Default.SportsEsports, "Step 3", "Pick your wake-up game", "This is how you'll prove you're actually awake")
    ChoiceList {
        gameOptions.forEach {
            SelectRow(it.label, it.desc, it.icon, it.color, selected == it.id, it.tag) { onSelect(it.id) }
        }
    }
}

@Composable
private fun GoalStep(value: String, onChange: (String) -> Unit) {
    StepHeader(Icons.Default.TrackChanges, "Step 4", "What's your morning goal?", "What gets you out of bed? It shows on your home screen")
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        goalPresets.take(3).forEach { preset ->
            GoalChip(preset, value == preset.label, Modifier.weight(1f)) { onChange(if (value == preset.label) "" else preset.label) }
        }
    }
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        goalPresets.drop(3).forEach { preset ->
            GoalChip(preset, value == preset.label, Modifier.weight(1f)) { onChange(if (value == preset.label) "" else preset.label) }
        }
    }
    Spacer(Modifier.height(14.dp))
    Field(value, "Or describe your own goal...", false) { onChange(it.take(60)) }
    Text("${value.length}/60", color = Color(0xFF4B5563), fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
}

@Composable
private fun TextInputStep(icon: ImageVector, eyebrow: String, title: String, subtitle: String, placeholder: String, value: String, numeric: Boolean, onChange: (String) -> Unit) {
    StepHeader(icon, eyebrow, title, subtitle)
    Field(value, placeholder, numeric, onChange)
}

@Composable
private fun BirthYearStep(birthYear: String, onChange: (String) -> Unit) {
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val minYear = currentYear - 100
    val selectedYear = birthYear.toIntOrNull()?.coerceIn(minYear, currentYear) ?: currentYear - 25

    StepHeader(Icons.Default.Cake, "Step 6", "What year were you born?", "Pick your birth year only")
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = ObInput,
        border = BorderStroke(1.dp, ObDawn.copy(alpha = 0.45f)),
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(18.dp)) {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Selected year", color = ObMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(selectedYear.toString(), color = ObText, fontSize = 38.sp, fontWeight = FontWeight.Black)
                }
                Text("${currentYear - selectedYear} years ago", color = ObDawn, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(14.dp))
            Slider(
                value = selectedYear.toFloat(),
                onValueChange = { next ->
                    onChange(next.toInt().coerceIn(minYear, currentYear).toString())
                },
                valueRange = minYear.toFloat()..currentYear.toFloat(),
                steps = (currentYear - minYear - 1).coerceAtLeast(0),
                colors = SliderDefaults.colors(
                    thumbColor = ObDawn,
                    activeTrackColor = ObDawn,
                    inactiveTrackColor = Color(0xFF2D3748),
                ),
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(minYear.toString(), color = ObMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(currentYear.toString(), color = ObMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
    Spacer(Modifier.height(10.dp))
    Text("Drag the slider to set your birth year.", color = ObMuted, fontSize = 12.sp, lineHeight = 16.sp)
}

@Composable
private fun CountryStep(selected: String, onSelect: (String) -> Unit) {
    var searchText by remember { mutableStateOf("") }
    val countries = remember { getCountries() }
    val filteredCountries = remember(searchText, countries) {
        if (searchText.isBlank()) {
            countries
        } else {
            val query = searchText.lowercase(Locale.ROOT)
            countries.filter { country ->
                country.lowercase(Locale.ROOT).contains(query)
            }
        }
    }

    StepHeader(Icons.Default.Public, "Step 7", "Which country are you in?", "We'll tailor the experience around where you are")
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(
            value = searchText,
            onValueChange = { searchText = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("Search country") },
            trailingIcon = {
                if (searchText.isNotBlank()) {
                    IconButton(onClick = { searchText = "" }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear search")
                    }
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = ObDawn,
                unfocusedBorderColor = ObBorder,
                focusedContainerColor = ObInput,
                unfocusedContainerColor = ObInput,
                focusedTextColor = ObText,
                unfocusedTextColor = ObText,
                cursorColor = ObDawn,
                focusedPlaceholderColor = ObMuted,
                unfocusedPlaceholderColor = ObMuted,
            ),
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = ObInput,
            border = BorderStroke(1.dp, ObBorder),
        ) {
            if (filteredCountries.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .padding(18.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("No countries match your search.", color = ObMuted, fontSize = 13.sp, textAlign = TextAlign.Center)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp),
                ) {
                    items(filteredCountries, key = { it }) { country ->
                        val isSelected = selected == country
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(country) },
                            color = if (isSelected) ObDawn.copy(alpha = 0.08f) else ObInput,
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                Text(
                                    text = country,
                                    color = if (isSelected) ObText else Color(0xFFD1D5DB),
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                                    modifier = Modifier.weight(1f),
                                )
                                if (isSelected) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = ObDawn, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                        Divider(color = ObBorder.copy(alpha = 0.55f))
                    }
                }
            }
        }
    }
}

@Composable
private fun AvatarStep(selected: String, onSelect: (String) -> Unit) {
    StepHeader(Icons.Default.Face, "Step 8", "Pick your profile icon", "This shows up on your home screen")
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        avatarOptions.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { avatar ->
                    val isSelected = selected == avatar.id
                    Surface(
                        modifier = Modifier.weight(1f).clickable { onSelect(avatar.id) },
                        shape = RoundedCornerShape(16.dp),
                        color = if (isSelected) avatar.color.copy(alpha = 0.12f) else ObInput,
                        border = BorderStroke(1.dp, if (isSelected) avatar.color else ObBorder),
                    ) {
                        Column(Modifier.padding(vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(avatar.icon, contentDescription = null, tint = if (isSelected) avatar.color else ObMuted, modifier = Modifier.size(28.dp))
                            Spacer(Modifier.height(6.dp))
                            Text(avatar.label, color = if (isSelected) avatar.color else ObMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryStep(data: OnboardingData) {
    Text("All set", color = ObDawn, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
    Spacer(Modifier.height(8.dp))
    Text("Here's your setup, ${data.name.ifBlank { "legend" }}", color = ObText, fontSize = 23.sp, lineHeight = 26.sp, fontWeight = FontWeight.Black)
    Text("Everything looks good. Save your setup to start fresh on this phone.", color = ObMuted, fontSize = 13.sp, lineHeight = 19.sp)
    Spacer(Modifier.height(18.dp))
    SummaryRow("Wake time", formatTime(data.wakeTime))
    SummaryRow("Morning type", morningTypes.firstOrNull { it.value == data.morningRating }?.label ?: "-")
    SummaryRow("Wake-up game", gameOptions.firstOrNull { it.id == data.favoriteGame }?.label ?: "-")
    SummaryRow("Morning goal", data.wakeGoal.ifBlank { "-" })
    SummaryRow("Display name", data.name.ifBlank { "-" })
    SummaryRow("Birth year", data.age.ifBlank { "-" })
    SummaryRow("Country", data.country.ifBlank { "-" })
    SummaryRow("Icon", avatarOptions.firstOrNull { it.id == data.profileIcon }?.label ?: "-")
}

@Composable
private fun ChoiceList(content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp), content = content)
}

@Composable
private fun SelectRow(title: String, desc: String, icon: ImageVector, color: Color, selected: Boolean, tag: String? = null, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        color = if (selected) color.copy(alpha = 0.08f) else ObInput,
        border = BorderStroke(1.dp, if (selected) color else ObBorder),
    ) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(32.dp).background(if (selected) color.copy(alpha = 0.16f) else Color(0xFF1F2937), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                Icon(icon, contentDescription = null, tint = if (selected) color else ObMuted, modifier = Modifier.size(18.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(title, color = if (selected) ObText else Color(0xFFD1D5DB), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                if (desc.isNotBlank()) Text(desc, color = ObMuted, fontSize = 12.sp, lineHeight = 16.sp)
            }
            if (tag != null) {
                Surface(shape = RoundedCornerShape(14.dp), color = Color(0xFF1F2937), border = BorderStroke(1.dp, ObBorder)) {
                    Text(tag, color = ObMuted, fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                }
            } else if (selected) {
                Icon(Icons.Default.Check, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
        }
    }
}

@Composable
private fun GoalChip(preset: PresetOption, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        color = if (selected) ObDawn.copy(alpha = 0.10f) else ObInput,
        border = BorderStroke(1.dp, if (selected) ObDawn else ObBorder),
    ) {
        Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(preset.icon, contentDescription = null, tint = if (selected) ObDawn else ObMuted, modifier = Modifier.size(18.dp))
            Spacer(Modifier.height(5.dp))
            Text(preset.label, color = if (selected) ObDawn else Color(0xFF9CA3AF), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, lineHeight = 13.sp)
        }
    }
}

@Composable
private fun Field(value: String, placeholder: String, numeric: Boolean, onChange: (String) -> Unit) {
    BasicTextField(
        value = value,
        onValueChange = { next -> onChange(if (numeric) next.filter(Char::isDigit) else next) },
        singleLine = true,
        textStyle = TextStyle(color = ObText, fontSize = 18.sp, fontWeight = FontWeight.Bold),
        cursorBrush = SolidColor(ObDawn),
        modifier = Modifier.fillMaxWidth(),
        decorationBox = { inner ->
            Surface(shape = RoundedCornerShape(12.dp), color = ObInput, border = BorderStroke(1.dp, ObBorder)) {
                Box(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 15.dp)) {
                    if (value.isBlank()) Text(placeholder, color = Color(0xFF4B5563), fontSize = 16.sp)
                    inner()
                }
            }
        },
    )
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Surface(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(10.dp), color = ObInput, border = BorderStroke(1.dp, Color(0xFF1F2937))) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label.uppercase(), color = ObMuted, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 0.8.sp, modifier = Modifier.weight(1f))
            Text(value, color = ObText, fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
        }
    }
}

private fun formatTime(time: String): String {
    val parts = time.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 7
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val period = if (h >= 12) "PM" else "AM"
    val hour = h % 12
    return "${if (hour == 0) 12 else hour}:${m.toString().padStart(2, '0')} $period"
}
