-- Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  read boolean default false not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
create policy "Users can view messages sent by or to them"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert messages sent by them"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update read status of messages received by them"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Create a function to handle new message notifications (optional, but good for realtime)
-- For now, we'll rely on client-side subscriptions.
