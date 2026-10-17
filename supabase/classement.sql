-- ============================================================
-- KULTIVO — classement entre amis (à lancer UNE fois dans Supabase : SQL Editor → New query → Run)
-- 3 tables : pseudos (profiles), amis (friendships), scores de la semaine (scores)
-- ============================================================

-- 1) PSEUDOS : un par compte, unique (sans tenir compte des majuscules)
create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  pseudo text not null check (pseudo ~ '^[A-Za-z0-9À-ÿ_.-]{3,16}$'),
  created_at timestamptz not null default now()
);
create unique index profiles_pseudo_unique on public.profiles (lower(pseudo));
alter table public.profiles enable row level security;
-- Les joueurs connectés peuvent lire les pseudos (pour ajouter un ami par son pseudo)
create policy "Lire les pseudos" on public.profiles
  for select to authenticated using (true);
create policy "Créer son pseudo" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Changer son pseudo" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) AMIS : une demande (pending) que l'autre accepte (accepted)
create table public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references auth.users on delete cascade,
  addressee uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
-- Une seule relation par paire de joueurs, dans un sens ou dans l'autre
create unique index friendships_pair on public.friendships
  (least(requester, addressee), greatest(requester, addressee));
alter table public.friendships enable row level security;
create policy "Voir ses amitiés" on public.friendships
  for select to authenticated using (auth.uid() in (requester, addressee));
create policy "Demander en ami" on public.friendships
  for insert to authenticated with check (auth.uid() = requester and status = 'pending');
create policy "Accepter une demande" on public.friendships
  for update to authenticated using (auth.uid() = addressee) with check (status = 'accepted');
create policy "Retirer un ami ou refuser" on public.friendships
  for delete to authenticated using (auth.uid() in (requester, addressee));

-- 3) SCORES : XP de la semaine (week = date du lundi) et de la semaine d'avant (pour le podium du lundi)
create table public.scores (
  user_id uuid primary key references auth.users on delete cascade,
  week date not null,
  week_xp int not null default 0 check (week_xp between 0 and 15000),
  prev_week date,
  prev_week_xp int not null default 0 check (prev_week_xp between 0 and 15000),
  streak int not null default 0 check (streak between 0 and 5000),
  updated_at timestamptz not null default now()
);
alter table public.scores enable row level security;
-- On voit son score et celui de ses amis (acceptés), pas ceux des inconnus
create policy "Voir les scores de ses amis" on public.scores
  for select to authenticated using (
    auth.uid() = user_id or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = auth.uid() and f.addressee = scores.user_id)
          or (f.addressee = auth.uid() and f.requester = scores.user_id))
    )
  );
create policy "Créer son score" on public.scores
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Mettre à jour son score" on public.scores
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Garde-fou anti-triche : pas plus de 3000 XP gagnés d'un coup en moins d'une heure
create function public.check_score_jump() returns trigger language plpgsql as $$
begin
  if new.week = old.week and new.week_xp - old.week_xp > 3000
     and now() - old.updated_at < interval '1 hour' then
    raise exception 'Progression trop rapide';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger scores_jump before update on public.scores
  for each row execute function public.check_score_jump();
