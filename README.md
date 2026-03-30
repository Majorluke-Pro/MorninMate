# 🌅 MorninMate

> **Wake up. Level up. No worries.**

MorninMate is a **gamified alarm PWA** that makes snoozing impossible — and actually fun. When your alarm fires, you must beat a mini-game to turn it off. Every morning you complete earns XP. Every streak you build earns bragging rights.

No snooze button. Just results.

[![Live App](https://img.shields.io/badge/Try%20It-mornin--mate.vercel.app-orange?style=for-the-badge)](https://mornin-mate.vercel.app)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

---

## 🎮 How it works

1. **Set your alarm** — pick a time, choose your wake-up intensity
2. **Alarm fires** — instead of a snooze button, you get a mini-game
3. **Beat the game** — only then does the alarm stop
4. **Earn XP & build streaks** — every completed morning levels you up

---

## 🕹️ Wake-up Games

| Game | Description |
|---|---|
| **Math Blitz** | Solve quick arithmetic problems to prove your brain is awake |
| **Memory Match** | Flip and match emoji pairs — no cheating |
| **Reaction Rush** | Tap at exactly the right moment — timing is everything |

---

## ⚡ Intensity Levels

| Level | Games | Difficulty | XP Reward |
|---|---|---|---|
| 🌿 Gentle | 1 game | Easy | 20 XP |
| ☀️ Moderate | 2 games | Normal | 35 XP |
| 🔥 Intense | 3 games | Hard | 60 XP |

---

## 🏆 Progression System

- **XP** — earn points for every alarm you complete
- **Streaks** — keep your morning streak alive day after day
- **Demerits** — fail a game and pay the price
- **Profile** — track your stats, favorite game, and morning goal

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| UI Components | Material UI (MUI v7) + Emotion |
| Routing | React Router v7 |
| Backend / Auth / DB | Supabase (Postgres + Auth) |
| Audio | Web Audio API — fully synthesized, no audio files |
| Deployment | Vercel (PWA, static hosting) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
git clone https://github.com/Majorluke-Pro/MorninMate.git
cd MorninMate
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Set up your Supabase tables:

**`profiles`**
| column | type |
|---|---|
| id | uuid (references auth.users, primary key) |
| name | text |
| wake_time | text |
| morning_type | int4 |
| preferred_game | text |
| morning_goal | text |
| onboarding_complete | bool |
| xp | int4 |
| demerits | int4 |
| alarms_completed | int4 |

**`alarms`**
| column | type |
|---|---|
| id | uuid (primary key, default gen_random_uuid()) |
| user_id | uuid (references auth.users) |
| label | text |
| time | text |
| days | int4[] |
| active | bool |
| pulse | jsonb |
| created_at | timestamptz |

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

---

## 🌍 First-Run Experience

New users go through a **7-step onboarding** — name, preferred wake time, morning personality type, favourite game, and a daily morning goal. After that, sign up to sync your data or continue as a guest.

---

## 📄 License

MIT — feel free to fork, hack, and make your mornings legendary.

---

*Built for people who keep hitting snooze. You know who you are.*
