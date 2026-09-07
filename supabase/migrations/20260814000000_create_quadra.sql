create extension if not exists "pgcrypto";

create type public.plan_status as enum ('open', 'confirmed', 'cancelled');
create type public.availability_status as enum ('perfect', 'maybe', 'no');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  public_slug text not null unique,
  title text not null check (char_length(trim(title)) > 0),
  type text not null default 'football' check (type = 'football'),
  area_label text,
  min_participants integer not null check (min_participants > 0),
  max_participants integer check (max_participants is null or max_participants >= min_participants),
  duration_minutes integer not null check (duration_minutes in (60, 90)),
  timezone text not null default 'Europe/Madrid',
  status public.plan_status not null default 'open',
  confirmed_slot_id uuid,
  admin_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (plan_id, start_at),
  check (end_at > start_at)
);

alter table public.plans
  add constraint plans_confirmed_slot_fk
  foreign key (confirmed_slot_id) references public.plan_slots(id) on delete set null;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  edit_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability (
  participant_id uuid not null references public.participants(id) on delete cascade,
  slot_id uuid not null references public.plan_slots(id) on delete cascade,
  status public.availability_status not null,
  updated_at timestamptz not null default now(),
  primary key (participant_id, slot_id)
);

create index plan_slots_plan_start_idx on public.plan_slots (plan_id, start_at);
create index participants_plan_idx on public.participants (plan_id);
create index availability_slot_idx on public.availability (slot_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_set_updated_at before update on public.plans
for each row execute procedure public.set_updated_at();
create trigger participants_set_updated_at before update on public.participants
for each row execute procedure public.set_updated_at();

-- The application uses a Supabase Secret Key only on the server. Keep browser roles closed.
alter table public.plans enable row level security;
alter table public.plan_slots enable row level security;
alter table public.participants enable row level security;
alter table public.availability enable row level security;
