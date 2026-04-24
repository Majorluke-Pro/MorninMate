# Native Bottom Navigation Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React WebView bottom nav bar with a native Kotlin/Compose overlay so tab taps respond at single-frame speed (~16ms), and preload all tab panels in React so switching between visited tabs is instant.

**Architecture:** A new `NativeBottomNav.kt` file creates a `ComposeView` anchored to the bottom of `MainActivity`'s root `FrameLayout`. Tapping a tab fires a Capacitor JS event (`navTabChanged`) that React listens for to update tab state. The React nav bar is hidden on native. All three React tab panels are kept mounted (CSS `display` toggle) so revisiting a tab does not remount it.

**Tech Stack:** Kotlin + Jetpack Compose, Java (MainActivity), React (Home.jsx), Capacitor bridge (`triggerJSEvent`)

**Note:** No automated test suite — manual on-device verification at end of each task.

---

### Task 1: Create `NativeBottomNav.kt` and add `material-icons-extended`

**Files:**
- Modify: `android/app/build.gradle:80`
- Create: `android/app/src/main/java/com/morninmate/app/NativeBottomNav.kt`

**Context:**  
The Alarm and BarChart icons used in the nav bar are in `material-icons-extended`, which is not yet a dependency. We add it alongside the existing `material-icons-core`. Then we create the entire native nav: the `BottomNavBar` Composable and the `setupNativeBottomNav()` function that Java calls to attach it to the window.

- [ ] **Step 1: Add `material-icons-extended` to `android/app/build.gradle`**

  In `android/app/build.gradle`, add one line after the existing `material-icons-core` line (line 80):

  ```groovy
  implementation 'androidx.compose.material:material-icons-core'
  implementation 'androidx.compose.material:material-icons-extended'
  ```

- [ ] **Step 2: Create `NativeBottomNav.kt`**

  Create the file at `android/app/src/main/java/com/morninmate/app/NativeBottomNav.kt` with the full content below. Nothing in this file is referenced by existing code yet — that happens in Task 2.

  ```kotlin
  package com.morninmate.app

  import android.view.Gravity
  import android.widget.FrameLayout
  import androidx.activity.ComponentActivity
  import androidx.compose.animation.core.animateDpAsState
  import androidx.compose.animation.core.animateFloatAsState
  import androidx.compose.animation.core.spring
  import androidx.compose.foundation.background
  import androidx.compose.foundation.clickable
  import androidx.compose.foundation.interaction.MutableInteractionSource
  import androidx.compose.foundation.layout.Arrangement
  import androidx.compose.foundation.layout.Box
  import androidx.compose.foundation.layout.BoxWithConstraints
  import androidx.compose.foundation.layout.Column
  import androidx.compose.foundation.layout.Row
  import androidx.compose.foundation.layout.fillMaxWidth
  import androidx.compose.foundation.layout.height
  import androidx.compose.foundation.layout.navigationBarsPadding
  import androidx.compose.foundation.layout.offset
  import androidx.compose.foundation.layout.size
  import androidx.compose.foundation.layout.width
  import androidx.compose.foundation.shape.RoundedCornerShape
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.Alarm
  import androidx.compose.material.icons.filled.BarChart
  import androidx.compose.material.icons.filled.Person
  import androidx.compose.material3.Icon
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  import androidx.compose.runtime.getValue
  import androidx.compose.runtime.mutableStateOf
  import androidx.compose.runtime.remember
  import androidx.compose.runtime.setValue
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.draw.drawBehind
  import androidx.compose.ui.geometry.Offset
  import androidx.compose.ui.graphics.Brush
  import androidx.compose.ui.graphics.Color
  import androidx.compose.ui.graphics.graphicsLayer
  import androidx.compose.ui.graphics.vector.ImageVector
  import androidx.compose.ui.platform.ComposeView
  import androidx.compose.ui.platform.ViewCompositionStrategy
  import androidx.compose.ui.text.font.FontWeight
  import androidx.compose.ui.unit.dp
  import androidx.compose.ui.unit.sp

  private val NavNight    = Color(0xFF0D0D1A)
  private val NavBorder   = Color(0x0EFFFFFF)
  private val NavDawn     = Color(0xFFFF6B35)
  private val NavSunrise  = Color(0xFFFFD166)
  private val NavInactive = Color(0x47FFFFFF)

  private data class NavTabItem(val label: String, val icon: ImageVector)

  private val NAV_TABS = listOf(
      NavTabItem("Alarms",  Icons.Default.Alarm),
      NavTabItem("Stats",   Icons.Default.BarChart),
      NavTabItem("Profile", Icons.Default.Person),
  )

  fun interface NavTabListener {
      fun onTabSelected(tab: Int)
  }

  fun setupNativeBottomNav(activity: ComponentActivity, listener: NavTabListener) {
      val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
      val composeView = ComposeView(activity).apply {
          setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
          setContent {
              BottomNavBar(onTabSelected = { listener.onTabSelected(it) })
          }
      }
      root.addView(
          composeView,
          FrameLayout.LayoutParams(
              FrameLayout.LayoutParams.MATCH_PARENT,
              FrameLayout.LayoutParams.WRAP_CONTENT,
              Gravity.BOTTOM,
          ),
      )
  }

  @Composable
  fun BottomNavBar(onTabSelected: (Int) -> Unit) {
      var selectedTab by remember { mutableStateOf(0) }

      Column(
          modifier = Modifier
              .fillMaxWidth()
              .background(NavNight)
              .drawBehind {
                  drawLine(
                      color = NavBorder,
                      start = Offset(0f, 0f),
                      end = Offset(size.width, 0f),
                      strokeWidth = 1.dp.toPx(),
                  )
              }
              .navigationBarsPadding(),
      ) {
          BoxWithConstraints(
              modifier = Modifier
                  .fillMaxWidth()
                  .height(64.dp),
          ) {
              val tabWidth = maxWidth / 3
              val pillTargetX = tabWidth * selectedTab.toFloat() + tabWidth / 2 - 22.dp
              val pillX by animateDpAsState(
                  targetValue = pillTargetX,
                  animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
                  label = "pillX",
              )

              Row(
                  modifier = Modifier
                      .fillMaxWidth()
                      .height(64.dp),
              ) {
                  NAV_TABS.forEachIndexed { index, tab ->
                      val selected = selectedTab == index
                      val iconScale by animateFloatAsState(
                          targetValue = if (selected) 1.1f else 1f,
                          animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
                          label = "scale$index",
                      )
                      Column(
                          modifier = Modifier
                              .weight(1f)
                              .height(64.dp)
                              .clickable(
                                  indication = null,
                                  interactionSource = remember { MutableInteractionSource() },
                              ) {
                                  selectedTab = index
                                  onTabSelected(index)
                              },
                          horizontalAlignment = Alignment.CenterHorizontally,
                          verticalArrangement = Arrangement.Center,
                      ) {
                          Icon(
                              imageVector = tab.icon,
                              contentDescription = tab.label,
                              tint = if (selected) NavDawn else NavInactive,
                              modifier = Modifier
                                  .size(23.dp)
                                  .graphicsLayer { scaleX = iconScale; scaleY = iconScale },
                          )
                          Text(
                              text = tab.label,
                              color = if (selected) NavDawn else NavInactive,
                              fontSize = 9.3.sp,
                              fontWeight = FontWeight.Bold,
                          )
                      }
                  }
              }

              // Sliding pill anchored to bottom
              Box(
                  modifier = Modifier
                      .align(Alignment.BottomStart)
                      .offset(x = pillX, y = (-8).dp)
                      .width(44.dp)
                      .height(3.dp)
                      .background(
                          Brush.horizontalGradient(listOf(NavDawn, NavSunrise)),
                          RoundedCornerShape(2.dp),
                      ),
              )
          }
      }
  }
  ```

- [ ] **Step 3: Build to confirm no compile errors**

  ```bash
  cd /c/dev/MorninMate/android && ./gradlew compileDebugKotlin
  ```

  Expected: `BUILD SUCCESSFUL`. If `Icons.Default.BarChart` fails to resolve, verify `material-icons-extended` was added correctly in Step 1.

- [ ] **Step 4: Commit**

  ```bash
  cd /c/dev/MorninMate
  git add android/app/build.gradle
  git add android/app/src/main/java/com/morninmate/app/NativeBottomNav.kt
  git commit -m "feat: add native Compose bottom nav bar"
  ```

---

### Task 2: Wire the native nav bar into `MainActivity.java`

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/MainActivity.java:23-28`

**Context:**  
`MainActivity.java` extends `BridgeActivity` (Capacitor). We call `setupNativeBottomNav()` in `onCreate` after `super.onCreate()`. The tab selection callback fires a Capacitor JS event on `document` — React will listen for this in Task 3. `NativeBottomNavKt` is the auto-generated Java class name for top-level Kotlin functions in `NativeBottomNav.kt`.

- [ ] **Step 1: Add `setupNativeBottomNav` call to `MainActivity.java`**

  Replace the entire `onCreate` method (lines 22–28) with:

  ```java
  @Override
  protected void onCreate(Bundle savedInstanceState) {
      registerPlugin(AlarmPlugin.class);
      super.onCreate(savedInstanceState);
      applyAppShell();
      applyAlarmWindowFlags(getIntent());
      NativeBottomNavKt.setupNativeBottomNav(this, tabIndex ->
          getBridge().triggerJSEvent(
              "navTabChanged",
              "document",
              "{\"tab\":" + tabIndex + "}")
      );
  }
  ```

  `NativeBottomNavKt` is the Kotlin-generated Java wrapper for `NativeBottomNav.kt`. The `NavTabListener` is a `fun interface`, so a Java lambda implements it directly without needing `return Unit.INSTANCE`.

- [ ] **Step 2: Build and install on device**

  ```bash
  cd /c/dev/MorninMate/android && ./gradlew installDebug
  ```

  Expected: `BUILD SUCCESSFUL`, `Installed on 1 device.`

  Open the app. Confirm a native dark nav bar appears at the bottom with Alarms, Stats, Profile tabs and the orange pill under Alarms. Tap between tabs — the taps should feel instantaneous (native speed). The content area won't switch yet (that's Task 3).

- [ ] **Step 3: Commit**

  ```bash
  cd /c/dev/MorninMate
  git add android/app/src/main/java/com/morninmate/app/MainActivity.java
  git commit -m "feat: wire native bottom nav into MainActivity"
  ```

---

### Task 3: React side — hide web nav, listen for events, preload tabs

**Files:**
- Modify: `src/components/Home/Home.jsx:113-180`

**Context:**  
`Home.jsx` currently conditionally mounts tabs (`tab === 0 && <AlarmsTab />`), which remounts the component on every switch. We switch to always-mounted panels with CSS `display` toggling. We also hide the React nav on native (`isNative` is already imported at line 39) and add a listener for the `navTabChanged` document event that the native nav fires.

The `useEffect` import is already at line 1. The `isNative` import is already at line 39.

- [ ] **Step 1: Rewrite the `Home` component function**

  Replace lines 113–180 (the entire `Home` function) with:

  ```jsx
  export default function Home() {
    const [tab, setTab] = useState(0);
    const [alarmOverlayOpen, setAlarmOverlayOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
      if (!isNative) return;
      function handleNavTab(e) { setTab(e.detail?.tab ?? 0); }
      document.addEventListener('navTabChanged', handleNavTab);
      return () => document.removeEventListener('navTabChanged', handleNavTab);
    }, []);

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', pb: 9 }}>
          <div style={{ display: tab === 0 ? 'block' : 'none' }}>
            <AlarmsTab onNavigate={navigate} onOverlayChange={setAlarmOverlayOpen} />
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
  ```

  Key changes vs the original:
  - Added `useEffect` that registers the `navTabChanged` listener only on native
  - Tab panels changed from `{tab === N && <TabComponent />}` to always-mounted `<div style={{ display: ... }}>`
  - Nav bar wrapped in `{!isNative && !alarmOverlayOpen && (...)}`

- [ ] **Step 2: Sync web assets into the Android app**

  Capacitor requires web assets to be copied into the Android project before building:

  ```bash
  cd /c/dev/MorninMate && npx cap sync android
  ```

  Expected output includes: `✔ Copying web assets` and `✔ Updating Android plugins`.

- [ ] **Step 3: Build and install on device**

  ```bash
  cd /c/dev/MorninMate/android && ./gradlew installDebug
  ```

  Expected: `BUILD SUCCESSFUL`, `Installed on 1 device.`

- [ ] **Step 4: Verify on device**

  Open the app and confirm:
  1. Tapping Alarms / Stats / Profile in the **native** nav bar switches tab content instantly
  2. The React nav bar is **not** visible (only the native one)
  3. Switching back to a previously-visited tab is instant (no remount flash — content was kept)
  4. On web (browser): the React nav bar still appears and works normally

- [ ] **Step 5: Commit**

  ```bash
  cd /c/dev/MorninMate
  git add src/components/Home/Home.jsx
  git commit -m "feat: hide web nav on native and preload tab panels"
  ```
