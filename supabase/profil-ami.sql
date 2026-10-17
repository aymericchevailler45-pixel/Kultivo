-- ============================================================
-- KULTIVO — profil visible par les amis (à lancer UNE fois)
-- Petit résumé (titre, série, stats, badges, cartes) envoyé avec le score : la sauvegarde complète reste privée.
-- Mêmes règles que les scores : visible seulement par soi et ses amis acceptés.
-- ============================================================
alter table public.scores
  add column if not exists summary jsonb check (pg_column_size(summary) < 8000);
