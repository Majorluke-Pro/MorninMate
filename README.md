# Mornin' Mate

A smart alarm app that forces you out of bed by making you complete mini-games before you can dismiss the alarm. Built as a Progressive Web App (PWA) with React.

## What it does

Set an alarm, choose your wake-up intensity, and when it fires you must pass a gauntlet of brain-activating games to turn it off. No snooze button — just results.

**Three wake-up games:**
- **Math Blitz** — solve quick arithmetic problems
- **Memory Match** — flip and match emoji pairs
- **Reaction Rush** — tap at exactly the right moment

**Three intensity levels:**
- **Gentle** — 1 game, easy mode (20 XP)
- **Moderate** — 2 games, normal mode (35 XP)
- **Intense** — 3 games, hard mode (60 XP)

You earn XP for completing alarms and lose demerit points for failing games. Stats and a personal profile track your progress over time.

## Tech stack

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

| Layer | Technology |
|---|---|
| Frontend framework | React 19 |
| Build tool | Vite |
| UI components | Material UI (MUI v7) + Emotion |
| Routing | React Router v7 |
| Backend / Auth / DB | Supabase (Postgres + Auth) |
| Audio | Web Audio API — fully synthesized, no audio files |
| Deployment | Vercel (static, client-side routing via `vercel.json`) |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd mornin-mate
npm install
```

2. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. In your Supabase project, create the following tables:

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

4. Start the dev server:

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

The `dist/` folder can be deployed to any static host (Vercel, Netlify, etc.). A `vercel.json` is included for client-side routing support on Vercel.

## First-run flow

New users go through a 7-step onboarding to set their name, preferred wake time, morning personality type, favourite game, and a daily morning goal. After that they can sign up / log in to persist their data, or continue as a guest.
