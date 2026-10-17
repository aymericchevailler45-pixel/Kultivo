-- ============================================================
-- KULTIVO — défi du jour comparé avec les amis (à lancer UNE fois, après classement.sql)
-- Ajoute le score du défi du jour au tableau des scores (mêmes règles de sécurité : soi et ses amis).
-- ============================================================
alter table public.scores
  add column if not exists daily_day date,
  add column if not exists daily_score int check (daily_score between 0 and 10),
  add column if not exists daily_seconds int check (daily_seconds between 0 and 36000);
