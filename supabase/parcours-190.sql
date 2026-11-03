-- ============================================================
-- KULTIVO — taille du parcours : à lancer UNE fois dans le SQL Editor
-- 2026-11-03 : 190 niveaux, puis 230 (40 niveaux insérés en plus). Limite de la case « niveau » des cadeaux (gifts)
-- montée d'un coup à 400 pour ne plus avoir à y revenir à chaque ajout de niveaux.
-- Sans danger : on ne fait qu'élargir une limite (rien n'est effacé).
-- ============================================================
alter table public.gifts drop constraint if exists gifts_level_check;
alter table public.gifts add constraint gifts_level_check check (level between 1 and 400);
