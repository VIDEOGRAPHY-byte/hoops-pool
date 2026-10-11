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

-- Public reference data only; all pool/member data requires server auth.
create policy "public read teams" on teams for select to anon, authenticated using (true);
create policy "public read series" on series for select to anon, authenticated using (true);
create policy "public read odds_snapshots" on odds_snapshots for select to anon, authenticated using (true);
grant select on teams, series, odds_snapshots to anon, authenticated;

-- Private pool data is read only by authenticated server code. A policy name
-- does not constrain its role: the old "service" policies applied to PUBLIC.
drop policy if exists "public read pools" on public.pools;
drop policy if exists "public read participants" on public.participants;
drop policy if exists "public read picks" on public.picks;
drop policy if exists "service insert participants" on public.participants;
drop policy if exists "service insert picks" on public.picks;
drop policy if exists "service update picks" on public.picks;
drop policy if exists "service update series" on public.series;
drop policy if exists "service insert odds" on public.odds_snapshots;
revoke all on public.pools, public.participants, public.picks from public, anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.teams, public.series, public.odds_snapshots from public, anon, authenticated;
-- Supabase service_role bypasses RLS. Explicit grants keep this contract clear.
grant all on public.pools, public.participants, public.picks, public.teams, public.series, public.odds_snapshots to service_role;

-- Called only by the authenticated server using the service role. Row locks
-- serialize saves with admin pool/series locks; clients cannot invoke it.
create or replace function public.save_pool_pick(
  p_participant_id uuid, p_pool_id uuid, p_series_id uuid, p_team_id uuid, p_games integer
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_pool public.pools%rowtype;
  v_series public.series%rowtype;
begin
  select * into v_pool from public.pools where id = p_pool_id for update;
  if not found or v_pool.picks_locked_at is not null then
    raise exception 'Pool unavailable or locked';
  end if;
  perform 1 from public.participants where id = p_participant_id and pool_id = p_pool_id for update;
  if not found then raise exception 'Participant unavailable'; end if;
  select * into v_series from public.series where id = p_series_id for update;
  if not found then raise exception 'Series unavailable'; end if;
  if v_series.locked or v_series.winner_id is not null then raise exception 'Series locked'; end if;
  if p_team_id is null or (p_team_id is distinct from v_series.team_a_id and p_team_id is distinct from v_series.team_b_id) then
    raise exception 'Invalid team';
  end if;
  if p_games is not null and p_games not between 4 and 7 then raise exception 'Invalid games'; end if;
  insert into public.picks (participant_id, series_id, picked_team_id, games_prediction)
    values (p_participant_id, p_series_id, p_team_id, p_games)
    on conflict (participant_id, series_id) do update
    set picked_team_id = excluded.picked_team_id, games_prediction = excluded.games_prediction
    where not public.picks.locked;
  if not found then raise exception 'Pick locked'; end if;
end;
$$;
revoke all on function public.save_pool_pick(uuid, uuid, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.save_pool_pick(uuid, uuid, uuid, uuid, integer) to service_role;
