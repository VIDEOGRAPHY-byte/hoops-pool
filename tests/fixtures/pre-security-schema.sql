-- ============================================================
-- Hoops Pool — Supabase Schema
-- Run this in the Supabase SQL Editor for your project
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Pools ───────────────────────────────────────────────────
create table if not exists pools (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  passcode      text not null unique,
  picks_locked_at timestamptz,
  created_at    timestamptz default now()
);

-- ─── Teams ───────────────────────────────────────────────────
create table if not exists teams (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  abbreviation  text not null unique,
  seed          int not null,
  conference    text not null check (conference in ('East','West')),
  logo_url      text
);

-- ─── Series ──────────────────────────────────────────────────
create table if not exists series (
  id            uuid primary key default uuid_generate_v4(),
  round         int not null check (round between 1 and 4),
  conference    text not null check (conference in ('East','West','Finals')),
  slot          int not null,
  team_a_id     uuid references teams(id),
  team_b_id     uuid references teams(id),
  winner_id     uuid references teams(id),
  games         int check (games between 4 and 7),
  locked        boolean not null default false,
  created_at    timestamptz default now(),
  unique (round, conference, slot)
);

-- ─── Participants ─────────────────────────────────────────────
create table if not exists participants (
  id            uuid primary key default uuid_generate_v4(),
  pool_id       uuid not null references pools(id),
  display_name  text not null,
  created_at    timestamptz default now(),
  unique (pool_id, display_name)
);

-- ─── Picks ───────────────────────────────────────────────────
create table if not exists picks (
  id                uuid primary key default uuid_generate_v4(),
  participant_id    uuid not null references participants(id),
  series_id         uuid not null references series(id),
  picked_team_id    uuid not null references teams(id),
  games_prediction  int check (games_prediction between 4 and 7),
  locked            boolean not null default false,
  created_at        timestamptz default now(),
  unique (participant_id, series_id)
);

-- ─── Odds Snapshots ──────────────────────────────────────────
create table if not exists odds_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  team_id             uuid not null references teams(id),
  championship_odds   int not null,
  r1_win_prob         numeric(5,4) not null,
  fetched_at          timestamptz default now()
);

-- ─── Row Level Security ──────────────────────────────────────
alter table pools         enable row level security;
alter table teams         enable row level security;
alter table series        enable row level security;
alter table participants  enable row level security;
alter table picks         enable row level security;
alter table odds_snapshots enable row level security;

-- Public read for teams, series, pools, odds
create policy "public read teams"          on teams          for select using (true);
create policy "public read series"         on series         for select using (true);
create policy "public read pools"          on pools          for select using (true);
create policy "public read odds_snapshots" on odds_snapshots for select using (true);
create policy "public read participants"   on participants   for select using (true);
create policy "public read picks"          on picks          for select using (true);

-- Service role can do everything (used by seed + server actions)
create policy "service insert participants" on participants for insert with check (true);
create policy "service insert picks"        on picks        for insert with check (true);
create policy "service update picks"        on picks        for update using (true);
create policy "service update series"       on series       for update using (true);
create policy "service insert odds"         on odds_snapshots for insert with check (true);
