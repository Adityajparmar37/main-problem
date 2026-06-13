# 🧠 MindMate — Student Mental Wellness AI

A production-ready MVP for student mental wellness with AI-powered voice check-ins and analytics.

[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Node%20%2B%20MongoDB%20%2B%20Redis-6366f1)](#)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ **Voice AI Companion** | Adaptive 5-question check-in via mic → Whisper STT → OpenAI GPT → ElevenLabs TTS |
| 📊 **Analytics Dashboard** | Mood/stress trends, trigger frequency, emotional heatmap, recovery score |

---

## 🗂 Project Structure

```
main-problem/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # db.js, redis.js, env.js, logger.js
│   │   ├── controllers/  # auth, session, analytics
│   │   ├── services/     # ai, voice, session, analytics
│   │   ├── queries/      # Mongoose repository layer
│   │   ├── models/       # User, Session
│   │   ├── routes/       # auth, session, analytics
│   │   ├── middlewares/  # auth, rateLimiter, validation, error
│   │   ├── validators/   # Zod schemas
│   │   ├── utils/        # apiResponse.js
│   │   ├── app.js
│   │   └── server.js
│   ├── __tests__/        # Jest + Supertest
│   └── .env.example
├── frontend/             # React + Vite
│   └── src/
│       ├── api/          # Axios instances per feature
│       ├── features/     # auth, voice, analytics pages
│       ├── components/   # VoiceRecorder, AudioPlayer, Heatmap, TrendChart, InsightCard
│       ├── hooks/        # useVoice, useSession, useAnalytics
│       ├── store/        # Zustand: authStore, sessionStore
│       └── routes/       # ProtectedLayout
├── docker-compose.yml
└── vercel.json
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Redis (local or [Upstash free tier](https://upstash.com))
- OpenAI API key
- ElevenLabs API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd main-problem

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your keys
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string ≥ 16 chars |
| `REDIS_URL` | Redis connection URL |
| `OPENAI_API_KEY` | OpenAI API key (used for GPT + Whisper) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (default: Rachel) |

### 3. Start with Docker (recommended)

```bash
# From project root
docker-compose up
```

This starts the backend + Redis. Then in a separate terminal:

```bash
cd frontend && npm run dev
```

### 4. Start manually

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App available at: http://localhost:5173

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
npm test

# With coverage
npm run test:coverage
```

Tests cover:
- Auth: register, login, getMe (7 tests)
- Session: start, message, end, get (5 tests)
- Analytics: overview, trends, report (3 tests)

All external services (OpenAI, ElevenLabs, Redis) are mocked.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Session
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/session/start` | Start new session (mood, stress, sleep, study, goal) |
| POST | `/api/session/message` | Send audio (multipart) or text message |
| POST | `/api/session/end` | End session, generate report |
| GET | `/api/session/:id` | Get session by ID |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/overview` | Summary stats |
| GET | `/api/analytics/trends` | Mood/stress/trigger trends |
| GET | `/api/analytics/report` | Weekly report + heatmap |

---

## ☁️ Deployment (Vercel)

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-github-url>
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repository
3. Add all environment variables from `.env.example`

> **Note**: For production Redis, use [Upstash](https://upstash.com) (free tier, serverless-compatible).

### 3. MongoDB Atlas IP Whitelist

In MongoDB Atlas → Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`) for Vercel.

---

## ⚙️ Redis Key Schema

| Key | TTL | Purpose |
|---|---|---|
| `session:{sessionId}` | 30 min | Active session state + message history |
| `analytics:user:{id}:overview` | 1 hour | Cached analytics overview |
| `analytics:user:{id}:trends` | 1 hour | Cached trends data |
| `analytics:user:{id}:report` | 1 hour | Cached weekly report |
| `report:{sessionId}` | 15 min | Report generation status |
| `ratelimit:session:{userId}:{date}` | 24h | Daily session counter (max 20/day) |

---

## 🛡️ Security

- JWT authentication on all protected routes
- Bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS restricted to frontend origin
- Zod input validation on all endpoints
- Rate limiting: 20 sessions/day per user
- Environment variable validation on startup

---

## 🏗️ Architecture Decisions

- **Service layer**: All business logic in `services/` — controllers are thin
- **Repository layer**: All Mongoose queries in `queries/` — testable in isolation
- **Redis fail-open**: Rate limiter silently allows requests if Redis is down
- **Whisper STT**: Server-side transcription for cross-browser support
- **ElevenLabs audio**: Returned as base64 to avoid separate CDN/storage setup
- **Session memory**: Stored in Redis during session, persisted to MongoDB on end
