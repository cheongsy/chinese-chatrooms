-- Migration: unread message tracking for private conversations.
-- Run this in the Supabase SQL editor for a project that already has
-- supabase/migrations/002_direct_messages.sql applied.

create table conversation_reads (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table conversation_reads enable row level security;

create policy "users can read their own read markers"
  on conversation_reads for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own read markers"
  on conversation_reads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own read markers"
  on conversation_reads for update
  to authenticated
  using (auth.uid() = user_id);
