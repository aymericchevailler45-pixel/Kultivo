-- ============================================================
-- KULTIVO — DUELS ENTRE AMIS (2026-10-23) — à lancer UNE fois : SQL Editor → New query → coller → Run
-- Un duel = 10 questions tirées avec une « graine » (les mêmes pour les deux joueurs).
-- Le lanceur joue d'abord et enregistre son score ; l'ami a 48 h pour jouer les mêmes questions.
-- ============================================================

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger uuid not null references auth.users on delete cascade,
  opponent uuid not null references auth.users on delete cascade,
  seed text not null check (length(seed) between 4 and 40),
  created_at timestamptz not null default now(),
  c_score int not null check (c_score between 0 and 10),
  c_seconds int not null check (c_seconds between 0 and 36000),
  c_grid text check (length(c_grid) <= 80),
  o_score int check (o_score between 0 and 10),
  o_seconds int check (o_seconds between 0 and 36000),
  o_grid text check (length(o_grid) <= 80),
  played_at timestamptz
);
create index if not exists duels_challenger on public.duels (challenger, created_at desc);
create index if not exists duels_opponent on public.duels (opponent, created_at desc);

alter table public.duels enable row level security;

-- On ne voit que ses propres duels
drop policy if exists "Voir ses duels" on public.duels;
create policy "Voir ses duels" on public.duels
  for select to authenticated using (auth.uid() in (challenger, opponent));

-- On ne défie qu'un ami accepté, en ayant déjà joué (score du lanceur obligatoire, celui de l'ami vide)
drop policy if exists "Défier un ami" on public.duels;
create policy "Défier un ami" on public.duels
  for insert to authenticated with check (
    auth.uid() = challenger and challenger <> opponent and o_score is null and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = challenger and f.addressee = opponent) or (f.requester = opponent and f.addressee = challenger))
    )
  );

-- L'ami répond une seule fois, dans les 48 h
drop policy if exists "Répondre à un duel" on public.duels;
create policy "Répondre à un duel" on public.duels
  for update to authenticated
  using (auth.uid() = opponent and o_score is null and created_at > now() - interval '48 hours')
  with check (auth.uid() = opponent);

-- Garde-fou : en répondant, l'ami ne peut changer que SES cases (score, temps, grille)
create or replace function public.duels_guard() returns trigger language plpgsql as $$
begin
  if new.challenger <> old.challenger or new.opponent <> old.opponent or new.seed <> old.seed
     or new.c_score <> old.c_score or new.c_seconds <> old.c_seconds or new.c_grid is distinct from old.c_grid
     or new.created_at <> old.created_at or new.o_score is null then
    raise exception 'Duel : modification interdite';
  end if;
  new.played_at := now();
  return new;
end $$;
drop trigger if exists duels_guard on public.duels;
create trigger duels_guard before update on public.duels
  for each row execute function public.duels_guard();

-- Droits (règle Supabase depuis le 30/10/2026 : rien n'est donné automatiquement). Pas de DELETE : un duel
-- disparaît avec le compte.
grant select, insert, update on public.duels to authenticated;
