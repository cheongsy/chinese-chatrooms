-- Migration: private messaging (conversations + direct_messages).
-- Run this in the Supabase SQL editor for a project that already has
-- supabase/schema.sql applied. Adds direct messaging between users and
-- the 4 AI personas, on top of the existing public chatrooms.

alter table profiles add column system_prompt text;

update profiles set system_prompt =
  'You are Xiao Mei, a friendly Chinese conversation partner. Reply only in simple Chinese (HSK1-2 vocabulary, short sentences), 1-2 sentences, staying encouraging and curious about whatever the learner brings up.'
where id = '00000000-0000-0000-0000-000000000001';

update profiles set system_prompt =
  'You are Lao Wang, a Chinese conversation partner for an intermediate learner (HSK3-4). Reply only in Chinese, 2-3 sentences, and ask a follow-up question to keep the conversation going on whatever topic the learner raises.'
where id = '00000000-0000-0000-0000-000000000002';

update profiles set system_prompt =
  'You are Chef Chen, a friendly Chinese conversation partner who loves food, chatting with a beginner learner. Reply only in simple Chinese, 1-2 short sentences, and feel free to bring the conversation back to food when it fits naturally.'
where id = '00000000-0000-0000-0000-000000000003';

update profiles set system_prompt =
  'You are Ms. Liu, a Chinese conversation partner for an advanced learner. Reply only in fluent, natural Chinese with nuanced vocabulary and idioms, 2-4 sentences, challenging the learner with follow-up questions on whatever topic comes up.'
where id = '00000000-0000-0000-0000-000000000004';

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references profiles (id) on delete cascade,
  user_b_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint distinct_participants check (user_a_id <> user_b_id),
  constraint ordered_participants check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);

alter table conversations enable row level security;

create policy "participants can read their conversations"
  on conversations for select
  to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "users can create conversations they participate in"
  on conversations for insert
  to authenticated
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index direct_messages_conversation_id_created_at_idx on direct_messages (conversation_id, created_at);

alter table direct_messages enable row level security;

create policy "participants can read their messages"
  on direct_messages for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy "participants can send messages"
  on direct_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

alter publication supabase_realtime add table direct_messages;
