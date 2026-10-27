-- ============================================================
-- KULTIVO — QUÊTE EN DUO (2026-10-27) — à lancer UNE fois : SQL Editor → New query → coller → Run
-- Chaque semaine, chaque joueur est mis en duo (2 joueurs exactement, jamais 3) :
--   1) avec un ami libre qui a joué récemment ;
--   2) sinon avec un autre joueur qui attend un partenaire (tiré parmi ceux qui attendent) ;
--   3) sinon il attend ; personne en 24 h → Kulti (la mascotte) devient son partenaire.
-- Le tirage passe par la fonction quest_join (personne ne peut écrire dans la table directement).
-- ============================================================

create table if not exists public.quests (
  id bigint generated always as identity primary key,
  week date not null,                                        -- lundi de la semaine
  a uuid not null references auth.users on delete cascade,  -- celui qui a lancé le tirage
  b uuid references auth.users on delete cascade,           -- son partenaire (vide = en attente ou Kulti)
  kulti boolean not null default false,                     -- personne trouvé en 24 h : Kulti joue avec lui
  goal int not null default 1500,
  a_xp int not null default 0 check (a_xp between 0 and 15000),
  b_xp int not null default 0 check (b_xp between 0 and 15000),
  created_at timestamptz not null default now()
);
create unique index if not exists quests_week_a on public.quests (week, a);
create unique index if not exists quests_week_b on public.quests (week, b) where b is not null;

alter table public.quests enable row level security;
drop policy if exists "Voir ses quêtes" on public.quests;
create policy "Voir ses quêtes" on public.quests
  for select to authenticated using (auth.uid() in (a, b));

-- Tirage (ou quête déjà trouvée) de la semaine en cours
create or replace function public.quest_join() returns setof public.quests
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'Europe/Paris')::date;
  q public.quests;
  mate uuid;
begin
  if me is null then return; end if;
  -- un seul tirage à la fois (évite qu'un joueur se retrouve dans deux duos)
  perform pg_advisory_xact_lock(hashtext('kultivo-quest-' || wk::text));

  select * into q from public.quests where week = wk and (a = me or b = me);
  if found then
    if q.b is null and not q.kulti and q.created_at < now() - interval '24 hours' then
      update public.quests set kulti = true where id = q.id returning * into q;
    end if;
    return next q; return;
  end if;

  -- 1) un ami libre, qui a joué cette semaine ou la semaine d'avant
  select f.uid into mate
  from (select case when requester = me then addressee else requester end as uid
        from public.friendships where status = 'accepted' and me in (requester, addressee)) f
  join public.scores s on s.user_id = f.uid
  where not exists (select 1 from public.quests x where x.week = wk and (x.a = f.uid or x.b = f.uid))
    and ((s.week >= wk - 7 and s.week_xp > 0) or (s.prev_week >= wk - 7 and s.prev_week_xp > 0))
  order by random() limit 1;
  if mate is not null then
    insert into public.quests (week, a, b) values (wk, me, mate) returning * into q;
    return next q; return;
  end if;

  -- 2) un joueur qui attend déjà un partenaire
  select * into q from public.quests
  where week = wk and b is null and not kulti and a <> me
  order by created_at limit 1;
  if found then
    update public.quests set b = me where id = q.id returning * into q;
    return next q; return;
  end if;

  -- 3) personne : on attend
  insert into public.quests (week, a) values (wk, me) returning * into q;
  return next q;
end $$;

-- Envoie mes XP de la semaine dans ma quête (ne descend jamais)
create or replace function public.quest_push(p_xp int) returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'Europe/Paris')::date;
  v int := least(greatest(coalesce(p_xp, 0), 0), 15000);
begin
  if me is null then return; end if;
  update public.quests set a_xp = greatest(a_xp, v) where week = wk and a = me;
  update public.quests set b_xp = greatest(b_xp, v) where week = wk and b = me;
end $$;

-- Droits (règle Supabase depuis le 30/10/2026 : rien n'est donné automatiquement)
grant select on public.quests to authenticated;
revoke all on function public.quest_join() from public, anon;
revoke all on function public.quest_push(int) from public, anon;
grant execute on function public.quest_join() to authenticated;
grant execute on function public.quest_push(int) to authenticated;
