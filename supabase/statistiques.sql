-- ============================================================
-- KULTIVO — STATISTIQUES ANONYMES (2026-10-23) — à lancer UNE fois : SQL Editor → New query → coller → Run
-- Aucun compte, aucun pseudo n'est enregistré : seulement des compteurs par question et par niveau.
-- Le jeu n'écrit jamais directement dans les tables : il appelle la fonction record_stats (contrôlée).
-- ============================================================

-- 1) Compteurs par question (réussie ou ratée au 1er essai)
create table if not exists public.question_stats (
  qid int primary key,
  shown int not null default 0,
  right_first int not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Compteurs par niveau du parcours (commencé, réussi, raté, abandonné)
create table if not exists public.level_stats (
  level int primary key,
  started int not null default 0,
  won int not null default 0,
  lost int not null default 0,
  quit int not null default 0,
  updated_at timestamptz not null default now()
);

-- Personne ne lit ni n'écrit ces tables par l'API (RLS activée, aucune règle) : seule la fonction ci-dessous écrit
alter table public.question_stats enable row level security;
alter table public.level_stats enable row level security;

-- 3) La fonction appelée par le jeu à la fin d'une partie
--    p_answers : [{"q": 123, "ok": true}, …] (60 au plus) ; p_level : n° du niveau (ou null) ; p_outcome : won / lost / quit
create or replace function public.record_stats(p_answers jsonb, p_level int default null, p_outcome text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  a jsonb;
begin
  if jsonb_typeof(p_answers) = 'array' and jsonb_array_length(p_answers) <= 60 then
    for a in select * from jsonb_array_elements(p_answers) loop
      if (a->>'q') ~ '^[0-9]{1,6}$' then
        insert into question_stats (qid, shown, right_first)
          values ((a->>'q')::int, 1, case when (a->>'ok')::boolean then 1 else 0 end)
          on conflict (qid) do update set
            shown = question_stats.shown + 1,
            right_first = question_stats.right_first + excluded.right_first,
            updated_at = now();
      end if;
    end loop;
  end if;
  if p_level between 1 and 500 and p_outcome in ('won', 'lost', 'quit') then
    insert into level_stats (level, started, won, lost, quit)
      values (p_level, 1, (p_outcome = 'won')::int, (p_outcome = 'lost')::int, (p_outcome = 'quit')::int)
      on conflict (level) do update set
        started = level_stats.started + 1,
        won = level_stats.won + excluded.won,
        lost = level_stats.lost + excluded.lost,
        quit = level_stats.quit + excluded.quit,
        updated_at = now();
  end if;
end $$;

-- Droits (règle Supabase depuis le 30/10/2026 : rien n'est donné automatiquement)
revoke all on function public.record_stats(jsonb, int, text) from public;
grant execute on function public.record_stats(jsonb, int, text) to anon, authenticated;

-- 4) Listes prêtes à lire dans Table Editor (ou à m'envoyer) — au moins 5 joueurs par question
create or replace view public.questions_les_plus_ratees as
  select qid, shown as vues, right_first as reussies_1er_coup,
         round(100.0 * right_first / shown) as pourcentage_reussite
  from question_stats where shown >= 5
  order by right_first::float / shown asc, shown desc;

create or replace view public.questions_reussies_par_tous as
  select qid, shown as vues, right_first as reussies_1er_coup,
         round(100.0 * right_first / shown) as pourcentage_reussite
  from question_stats where shown >= 5 and right_first::float / shown >= 0.95
  order by shown desc;

create or replace view public.niveaux as
  select level as niveau, started as commences, won as reussis, lost as rates, quit as abandonnes,
         round(100.0 * won / nullif(started, 0)) as pourcentage_reussite,
         round(100.0 * quit / nullif(started, 0)) as pourcentage_abandon
  from level_stats order by level;

-- Les vues ne sont lisibles que depuis Supabase (pas par le jeu)
revoke all on public.questions_les_plus_ratees, public.questions_reussies_par_tous, public.niveaux from anon, authenticated;
