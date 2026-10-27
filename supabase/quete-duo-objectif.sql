-- ============================================================
-- KULTIVO — QUÊTE EN DUO : OBJECTIF ADAPTÉ AUX JOUEURS (2026-10-27) — à lancer après quete-duo.sql
-- (peut être relancé sans risque : il remplace les fonctions)
-- Cette semaine (lundi 26/10/2026) : 5 000 XP pour tout le monde.
-- Ensuite : objectif = moyenne des 3 dernières semaines du joueur + celle de son partenaire, arrondi à 500,
-- entre 1 500 et 10 000. Seules les semaines jouées comptent dans la moyenne ; aucune semaine jouée = 1 000.
-- Avec Kulti : le double de la moyenne du joueur. Les XP par semaine viennent du résumé envoyé par le jeu
-- (scores.summary -> 'weeks' : { "lundi": xp } des 3 semaines finies).
-- ============================================================

update public.quests set goal = 5000 where week = date '2026-10-26';

-- Moyenne des 3 dernières semaines jouées d'un joueur (1 000 s'il n'en a aucune)
create or replace function public.quest_level(p_user uuid, p_week date) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(round(avg(v))::int, 1000)
  from (
    select (s.summary -> 'weeks' ->> to_char(p_week - k, 'YYYY-MM-DD'))::int as v
    from public.scores s, unnest(array[7, 14, 21]) as k
    where s.user_id = p_user
  ) w
  where v > 0;
$$;

create or replace function public.quest_goal(p_a uuid, p_b uuid, p_week date) returns int
language plpgsql stable security definer set search_path = public as $$
declare
  total int;
begin
  if p_week = date '2026-10-26' then return 5000; end if;
  total := public.quest_level(p_a, p_week) + case when p_b is null then public.quest_level(p_a, p_week) else public.quest_level(p_b, p_week) end;
  return least(10000, greatest(1500, round(total / 500.0)::int * 500));
end $$;

-- Tirage : même règle qu'avant, l'objectif est calculé quand le duo est formé
create or replace function public.quest_join() returns setof public.quests
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'Europe/Paris')::date;
  q public.quests;
  mate uuid;
begin
  if me is null then return; end if;
  perform pg_advisory_xact_lock(hashtext('kultivo-quest-' || wk::text));

  select * into q from public.quests where week = wk and (a = me or b = me);
  if found then
    if q.b is null and not q.kulti and q.created_at < now() - interval '24 hours' then
      update public.quests set kulti = true, goal = public.quest_goal(q.a, null, wk) where id = q.id returning * into q;
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
    insert into public.quests (week, a, b, goal) values (wk, me, mate, public.quest_goal(me, mate, wk)) returning * into q;
    return next q; return;
  end if;

  -- 2) un joueur qui attend déjà un partenaire
  select * into q from public.quests
  where week = wk and b is null and not kulti and a <> me
  order by created_at limit 1;
  if found then
    update public.quests set b = me, goal = public.quest_goal(q.a, me, wk) where id = q.id returning * into q;
    return next q; return;
  end if;

  -- 3) personne : on attend
  insert into public.quests (week, a, goal) values (wk, me, public.quest_goal(me, null, wk)) returning * into q;
  return next q;
end $$;

revoke all on function public.quest_level(uuid, date) from public, anon, authenticated;
revoke all on function public.quest_goal(uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.quest_join() from public, anon;
grant execute on function public.quest_join() to authenticated;
