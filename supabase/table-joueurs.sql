-- ============================================================
-- KULTIVO — table « saves » lisible et pièces modifiables à la main (à lancer UNE fois)
-- • colonnes pseudo et niveau (remplies toutes seules)
-- • colonne coins modifiable : change le nombre dans Table Editor → saves, et le jeu ajoute
--   (ou retire) la différence au joueur en moins d'une minute, même si l'appli est ouverte.
-- ============================================================

-- 0) Si ce fichier est relancé : on retire d'abord le déclencheur (recréé à la fin)
drop trigger if exists saves_fill on public.saves;

-- 1) Boîte à cadeaux utilisée en coulisses (différence de pièces ou nouveau niveau ; le jeu la récupère)
create table if not exists public.gifts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  coins int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table public.gifts add column if not exists level int check (level between 1 and 150);
alter table public.gifts alter column coins set default 0;
alter table public.gifts drop constraint if exists gifts_coins_check;
alter table public.gifts add constraint gifts_coins_check
  check (coins between -100000 and 100000 and (coins <> 0 or level is not null));
alter table public.gifts enable row level security;
drop policy if exists "Voir ses cadeaux" on public.gifts;
create policy "Voir ses cadeaux" on public.gifts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Récupérer ses cadeaux" on public.gifts;
create policy "Récupérer ses cadeaux" on public.gifts
  for delete to authenticated using (auth.uid() = user_id);

-- 2) Colonnes lisibles : pseudo, niveau, pièces (coins devient une vraie colonne modifiable)
alter table public.saves drop column if exists coins;
alter table public.saves add column coins int;
alter table public.saves add column if not exists niveau int;
alter table public.saves add column if not exists pseudo text;

-- 3) On remplit tout de suite les lignes existantes (AVANT le déclencheur : sinon il offrirait
--    à chacun l'équivalent de ses pièces)
update public.saves s set
  coins = (s.data->>'coins')::int,
  niveau = (s.data->>'unlocked')::int,
  pseudo = (select p.pseudo from public.profiles p where p.user_id = s.user_id)
where true;

-- 4) À chaque sauvegarde : pseudo, niveau et pièces recopiés depuis le jeu.
--    Si seules les cases coins et/ou niveau ont changé (modification à la main) : elles partent dans la boîte
--    à cadeaux, et le jeu les applique (pièces ajoutées ou retirées, niveaux d'avant validés).
create or replace function public.saves_fill() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.pseudo := (select p.pseudo from profiles p where p.user_id = new.user_id);
  if tg_op = 'UPDATE' and new.data = old.data
     and (new.coins is distinct from old.coins or new.niveau is distinct from old.niveau) then
    insert into gifts (user_id, coins, level) values (
      new.user_id,
      coalesce(new.coins, 0) - coalesce(old.coins, 0),
      case when new.niveau is distinct from old.niveau then new.niveau end
    );
  else
    new.coins := (new.data->>'coins')::int;
    new.niveau := (new.data->>'unlocked')::int;
  end if;
  return new;
end $$;
drop trigger if exists saves_fill on public.saves;
create trigger saves_fill before insert or update on public.saves
  for each row execute function public.saves_fill();
