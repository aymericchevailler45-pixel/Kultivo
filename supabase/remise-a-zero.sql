-- ============================================================
-- KULTIVO — REMISE À ZÉRO TOTALE (2026-10-20)
-- Efface TOUS les comptes et TOUTES leurs données : sauvegardes, pseudos, avatars, amis, scores, cadeaux.
-- IRRÉVERSIBLE. À lancer UNE fois dans Supabase → SQL Editor → New query → coller → Run.
-- (Le jeu, de son côté, efface la progression de chaque téléphone à sa prochaine ouverture : RESET_EPOCH dans script.js.)
-- ============================================================

delete from public.gifts;
delete from public.friendships;
delete from public.scores;
delete from public.saves;
delete from public.profiles;
delete from auth.users;          -- les comptes eux-mêmes (e-mails, mots de passe)

-- Signalements de questions : ils ne contiennent pas de progression. Enlever les deux tirets ci-dessous
-- seulement si tu veux aussi les effacer.
-- delete from public.reports;

-- Vérification : tout doit afficher 0
select
  (select count(*) from auth.users)          as comptes,
  (select count(*) from public.saves)        as sauvegardes,
  (select count(*) from public.profiles)     as pseudos,
  (select count(*) from public.friendships)  as amities,
  (select count(*) from public.scores)       as scores,
  (select count(*) from public.gifts)        as cadeaux;
