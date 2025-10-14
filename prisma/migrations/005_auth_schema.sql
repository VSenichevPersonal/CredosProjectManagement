-- Auth tables aligned with Supabase-like schema
create schema if not exists auth;

create extension if not exists "pgcrypto";

create table if not exists auth."user" (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists auth.session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth."user"(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists auth."key" (
  id text primary key,
  user_id uuid references auth."user"(id) on delete cascade,
  hashed_password text
);

create index if not exists idx_auth_session_user_id on auth.session(user_id);
create index if not exists idx_auth_key_user_id on auth."key"(user_id);
