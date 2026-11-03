-- ============================================================
-- KULTIVO — parcours de 190 niveaux (2026-11-03) : à lancer UNE fois dans le SQL Editor
-- 20 niveaux insérés après le 80 et après le 90 : la case « niveau » des cadeaux (gifts) monte à 190.
-- Sans danger : on ne fait qu'élargir une limite (rien n'est effacé).
-- ============================================================
alter table public.gifts drop constraint if exists gifts_level_check;
alter table public.gifts add constraint gifts_level_check check (level between 1 and 190);
