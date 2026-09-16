# 聊天中文 — Chinese Language-Exchange Chatrooms

A web app for practicing Chinese in topic-based chatrooms. Every room has a
real LLM-powered AI conversation partner so it's never empty, and every
message can be translated or explained (pinyin, gloss, grammar notes) on
demand.

## Features

- Email/password sign up and login (Supabase Auth)
- Topic/level chatrooms (beginner small talk, HSK3 travel, food, advanced discussion)
- Real-time chat (Supabase Realtime)
- An AI persona in every room that replies in Chinese via the Claude API
- Per-message **Translate** (DeepL) and **Explain** (Claude: pinyin + gloss + grammar note)
- Toggleable pinyin annotations on any Chinese text
- Click any Chinese character in a message to save it to "My Vocab"

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres, Auth,
Realtime), DeepL API, Anthropic (Claude) API, `pinyin-pro`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates all tables, Row Level Security policies, and seeds four chatrooms
   with their AI personas.
3. In **Project Settings → API**, copy the project URL, `anon` public key,
   and `service_role` secret key.

### 3. Get API keys

- **DeepL**: a free API key from [deepl.com/pro-api](https://www.deepl.com/pro-api).
  (If you're on a paid DeepL plan, change the endpoint in
  [`lib/translate.ts`](lib/translate.ts) from `api-free.deepl.com` to `api.deepl.com`.)
- **Anthropic**: an API key from [console.anthropic.com](https://console.anthropic.com/).

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2 and 3:

```bash
cp .env.example .env.local
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up for an account,
and join a room.

## Project structure

- `app/(auth)/login`, `app/(auth)/signup` — auth pages
- `app/rooms`, `app/rooms/[roomId]` — room list and chat view
- `app/vocab` — saved vocabulary list
- `app/api/translate`, `app/api/explain`, `app/api/ai-reply` — server routes
  that call DeepL / Claude and keep API keys off the client
- `lib/supabase` — browser, server, and admin (service-role) Supabase clients
- `lib/claude.ts`, `lib/translate.ts` — API clients
- `supabase/schema.sql` — database schema, RLS policies, and seed data

## Notes

This is a portfolio-scale demo, not a production deployment: there's no
moderation, rate limiting, or support for language pairs beyond Chinese↔English.
