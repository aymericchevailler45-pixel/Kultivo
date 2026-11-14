-- ============================================================
-- KULTIVO — historique des sauvegardes sur 7 jours (à lancer UNE fois dans SQL Editor → Run)
-- • Chaque jour où un joueur joue, la partie telle qu'elle était AVANT sa 1re partie du jour est copiée
--   dans la table « saves_history » (une seule copie par joueur et par jour).
-- • Les copies de plus de 7 jours s'effacent toutes seules.
-- • Tout se passe dans Supabase : rien n'est envoyé aux téléphones (pas de trafic en plus).
-- • Invisible depuis le jeu (aucun droit pour les joueurs) ; lisible seulement dans Table Editor.
-- Fichier relançable sans risque.
-- ============================================================

-- 1) La table des copies
create table if not exists public.saves_history (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,   -- compte supprimé = copies supprimées
  day      date not null,                                                 -- jour de la copie (heure de Paris)
  pseudo   text,
  xp       integer,
  niveau   integer,
  data     jsonb not null,
  saved_at timestamptz not null default now(),
  unique (user_id, day)
);
alter table public.saves_history enable row level security;   -- aucune règle : personne ne la lit depuis le jeu
revoke all on public.saves_history from anon, authenticated;

-- 2) La copie, faite à la 1re modification de la journée
create or replace function public.saves_keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Europe/Paris')::date;
begin
  insert into saves_history (user_id, day, pseudo, xp, niveau, data)
  values (old.user_id, today, old.pseudo, old.xp, old.niveau, old.data)
  on conflict (user_id, day) do nothing;                      -- déjà une copie aujourd'hui : rien
  delete from saves_history where user_id = old.user_id and day < today - 7;
  return null;
end $$;

drop trigger if exists saves_keep_history on public.saves;
create trigger saves_keep_history after update on public.saves
  for each row when (old.data is distinct from new.data)
  execute function public.saves_keep_history();

-- ============================================================
-- MODE D'EMPLOI (ne pas lancer ces lignes avec le reste : les copier une par une si besoin)
--
-- Voir les copies d'un joueur (remplacer Pseudo) :
--   select day, xp, niveau, saved_at from public.saves_history where pseudo = 'Pseudo' order by day desc;
--
-- Remettre la partie d'un joueur comme elle était un jour donné (remplacer Pseudo et la date) :
--   update public.saves s set data = h.data, xp = h.xp, updated_at = now()
--   from public.saves_history h
--   where h.pseudo = 'Pseudo' and h.day = '2026-11-14' and s.user_id = h.user_id;
--
-- Puis le joueur ferme complètement le jeu et le rouvre (avec internet) : il récupère cette partie
-- (si le jeu demande « Quelle progression garder ? », il choisit celle du compte).
-- ============================================================
