-- ============================================================
-- KULTIVO — avatar personnalisé (couleur + dessin), visible par les amis (à lancer UNE fois)
-- ============================================================
alter table public.profiles
  add column if not exists avatar_hue int check (avatar_hue between 0 and 359),
  add column if not exists avatar_emoji text check (char_length(avatar_emoji) <= 8);
