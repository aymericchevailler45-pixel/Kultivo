-- ============================================================
-- KULTIVO — boîte à cadeaux : déposer des pièces pour un joueur depuis Supabase
-- Le jeu les récupère tout seul (en moins d'une minute, même ouvert) puis efface la ligne.
-- Les joueurs peuvent seulement LIRE et EFFACER leurs propres cadeaux, jamais en créer.
-- ============================================================
create table if not exists public.gifts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  coins int not null check (coins between 1 and 100000),
  note text,
  created_at timestamptz not null default now()
);
alter table public.gifts enable row level security;
create policy "Voir ses cadeaux" on public.gifts
  for select to authenticated using (auth.uid() = user_id);
create policy "Récupérer ses cadeaux" on public.gifts
  for delete to authenticated using (auth.uid() = user_id);

-- Pour donner des pièces (à relancer quand tu veux, en changeant le nombre) :
-- insert into gifts (user_id, coins) values ('bef7f100-48e2-4713-a11a-5bad72725390', 2000);
