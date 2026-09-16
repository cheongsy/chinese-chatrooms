-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

create type language_level as enum ('beginner', 'intermediate', 'advanced');

-- Profiles ------------------------------------------------------------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  avatar_url text,
  native_lang text not null default 'en',
  target_lang text not null default 'zh',
  level language_level not null default 'beginner',
  is_ai boolean not null default false,
  created_at timestamptz not null default now()
);

-- Real users get a profile row whose id matches their auth.users id.
-- AI persona profiles are seeded directly (no auth.users row) with is_ai = true,
-- so this FK is enforced only via application logic, not a hard constraint,
-- to allow AI persona rows to exist without a matching auth user.

alter table profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Rooms -----------------------------------------------------------------

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  topic text not null,
  level language_level not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;

create policy "rooms are readable by any authenticated user"
  on rooms for select
  to authenticated
  using (true);

-- Room AI personas -------------------------------------------------------

create table room_ai_personas (
  room_id uuid not null references rooms (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  system_prompt text not null,
  primary key (room_id, profile_id)
);

alter table room_ai_personas enable row level security;

create policy "room ai personas are readable by any authenticated user"
  on room_ai_personas for select
  to authenticated
  using (true);

-- Messages ----------------------------------------------------------------

create table messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_room_id_created_at_idx on messages (room_id, created_at);

alter table messages enable row level security;

create policy "messages are readable by any authenticated user"
  on messages for select
  to authenticated
  using (true);

create policy "users can insert their own messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Note: AI-authored messages are inserted from a trusted server route using
-- the service-role key, which bypasses RLS entirely, so no insert policy is
-- needed for is_ai profiles.

-- Saved vocab ---------------------------------------------------------------

create table saved_vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  hanzi text not null,
  pinyin text,
  translation text,
  source_message_id uuid references messages (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table saved_vocab enable row level security;

create policy "users can read their own saved vocab"
  on saved_vocab for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own saved vocab"
  on saved_vocab for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can delete their own saved vocab"
  on saved_vocab for delete
  to authenticated
  using (auth.uid() = user_id);

-- Realtime -------------------------------------------------------------------

alter publication supabase_realtime add table messages;

-- Seed data: rooms + AI personas ---------------------------------------------

insert into profiles (id, username, native_lang, target_lang, level, is_ai) values
  ('00000000-0000-0000-0000-000000000001', 'Xiao Mei (AI)', 'zh', 'en', 'beginner', true),
  ('00000000-0000-0000-0000-000000000002', 'Lao Wang (AI)', 'zh', 'en', 'intermediate', true),
  ('00000000-0000-0000-0000-000000000003', 'Chef Chen (AI)', 'zh', 'en', 'beginner', true),
  ('00000000-0000-0000-0000-000000000004', 'Ms. Liu (AI)', 'zh', 'en', 'advanced', true);

insert into rooms (id, name, topic, level, description) values
  ('10000000-0000-0000-0000-000000000001', 'Beginner Small Talk', 'daily life', 'beginner', 'Practice greetings, introductions, and everyday small talk in simple Chinese.'),
  ('10000000-0000-0000-0000-000000000002', 'HSK3 Travel', 'travel', 'intermediate', 'Talk about trips, directions, and travel plans using HSK3-level vocabulary.'),
  ('10000000-0000-0000-0000-000000000003', 'Food & Cooking', 'food', 'beginner', 'Chat about dishes, recipes, and ordering food in Chinese.'),
  ('10000000-0000-0000-0000-000000000004', 'Advanced Discussion', 'current events', 'advanced', 'Debate and discuss news, culture, and opinions in fluent Chinese.');

insert into room_ai_personas (room_id, profile_id, system_prompt) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'You are Xiao Mei, a friendly Chinese conversation partner chatting with a beginner learner. Reply only in simple Chinese (HSK1-2 vocabulary, short sentences). Keep replies to 1-2 sentences, stay encouraging, and gently continue the small-talk topic.'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'You are Lao Wang, a Chinese conversation partner discussing travel with an intermediate learner (around HSK3-4). Reply only in Chinese, 2-3 sentences, using travel-related vocabulary. Ask a follow-up question to keep the conversation going.'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   'You are Chef Chen, a friendly Chinese conversation partner who loves food, chatting with a beginner learner. Reply only in simple Chinese about food, dishes, or cooking, 1-2 short sentences.'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'You are Ms. Liu, a Chinese conversation partner for an advanced learner. Reply only in fluent, natural Chinese with nuanced vocabulary and idioms, discussing current events and culture in 2-4 sentences. Challenge the learner with follow-up questions.');
