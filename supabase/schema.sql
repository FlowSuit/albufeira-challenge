-- ============================================================
-- ALBUFEIRA CHALLENGE - Final schema v2 (75 challenges)
-- Plak VOLLEDIG in Supabase > SQL Editor > New query > Run
-- ============================================================
create extension if not exists "pgcrypto";

create table if not exists players (
  id               uuid primary key default gen_random_uuid(),
  name             text unique not null,
  team             text,
  score_adjustment int  not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  difficulty  text not null check (difficulty in ('makkelijk','gemiddeld','heftig','legendarisch')),
  points      int  not null,
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists submissions (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  challenge_id  uuid not null references challenges(id) on delete cascade,
  media_url     text not null,
  media_type    text not null,
  status        text not null default 'ingediend' check (status in ('ingediend','goedgekeurd','afgekeurd')),
  bonus_points  int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (player_id, challenge_id)
);

create table if not exists badges (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  type       text not null,
  label      text not null,
  created_at timestamptz not null default now(),
  unique (player_id, type)
);

create table if not exists roulette_spins (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  label      text not null,
  points_won int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists straf_challenges (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  dare       text not null,
  media_url  text,
  status     text not null default 'open' check (status in ('open','ingediend','goedgekeurd','afgekeurd')),
  created_at timestamptz not null default now()
);

create table if not exists game_settings (
  id                    int primary key default 1,
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  featured_challenge_id uuid references challenges(id) on delete set null,
  featured_until        timestamptz,
  is_closed             boolean not null default false,
  constraint single_row check (id = 1)
);

-- VIEWS
create or replace view player_scores as
select p.id, p.name, p.team,
  coalesce((select sum(c.points + s.bonus_points) from submissions s join challenges c on c.id = s.challenge_id where s.player_id = p.id and s.status = 'goedgekeurd'), 0)
  + coalesce((select sum(r.points_won) from roulette_spins r where r.player_id = p.id), 0)
  + p.score_adjustment as score,
  coalesce((select count(*) from submissions s where s.player_id = p.id and s.status = 'goedgekeurd'), 0) as completed
from players p;

create or replace view team_scores as
select p.team,
  sum(coalesce((select sum(c.points + s.bonus_points) from submissions s join challenges c on c.id = s.challenge_id where s.player_id = p.id and s.status = 'goedgekeurd'), 0)
    + coalesce((select sum(r.points_won) from roulette_spins r where r.player_id = p.id), 0) + p.score_adjustment) as score,
  sum(coalesce((select count(*) from submissions s where s.player_id = p.id and s.status = 'goedgekeurd'), 0)) as completed,
  array_agg(p.name order by p.name) as members
from players p where p.team is not null group by p.team order by score desc;

create or replace view claimed_challenges as
select s.challenge_id, p.name as claimed_by, p.team as claimed_by_team
from submissions s join players p on p.id = s.player_id where s.status = 'goedgekeurd';

-- TRIGGER: voorkom indienen van al geclaimed challenge
create or replace function prevent_claimed_submit() returns trigger as $$
begin
  if exists (select 1 from submissions where challenge_id = new.challenge_id and status = 'goedgekeurd') then
    raise exception 'Deze challenge is al geclaimed';
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_prevent_claimed on submissions;
create trigger trg_prevent_claimed before insert on submissions for each row execute function prevent_claimed_submit();

-- RLS
do $$ declare t text;
begin
  foreach t in array array['players','challenges','submissions','badges','roulette_spins','straf_challenges','game_settings']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- STORAGE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', true, 52428800,
  array['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
) on conflict (id) do update set public = true, file_size_limit = 104857600, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "proofs_read" on storage.objects;
drop policy if exists "proofs_insert" on storage.objects;
drop policy if exists "proofs_delete" on storage.objects;
create policy "proofs_read" on storage.objects for select using (bucket_id = 'proofs');
create policy "proofs_insert" on storage.objects for insert with check (bucket_id = 'proofs');
create policy "proofs_delete" on storage.objects for delete using (bucket_id = 'proofs');

-- GAME SETTINGS
insert into game_settings (id, start_at, end_at) values (1, now(), now() + interval '16 hours') on conflict (id) do nothing;

-- ============================================================
-- 75 CHALLENGES
-- ============================================================
insert into challenges (title, difficulty, points, sort) values
-- MAKKELIJK 1pt (14)
('Bestel iets in het Portugees','makkelijk',1,1),
('Foto met een hond','makkelijk',1,2),
('Selfie met een local','makkelijk',1,3),
('Eet een pastel de nata op camera','makkelijk',1,4),
('Duik in de zee (video)','makkelijk',1,5),
('Laat een onbekende dame je zonnebrand insmeren op je rug (video)','makkelijk',1,6),
('Drink een biertje door een rietje uit iemand anders z''n hand (video)','makkelijk',1,7),
('Bouw de hoogste menselijke piramide op het strand met onbekenden (foto)','makkelijk',1,8),
('Foto met een tuktuk of taxi','makkelijk',1,9),
('Vraag een local de weg in het Portugees (video)','makkelijk',1,10),
('Laat een onbekende een TikTok van jou maken terwijl jij danst (video)','makkelijk',1,11),
('Doe een sprintrace tegen een onbekende op het strand en win (video)','makkelijk',1,12),
('Drink een biertje in onder 10 seconden (video)','makkelijk',1,13),
('Selfie met een politieauto of agent','makkelijk',1,14),
-- GEMIDDELD 3pt (21)
('Koop het grootste ijsje dat je kunt vinden (foto) - admin kiest winnaar +5 bonus','gemiddeld',3,15),
('TikTok-dansje met een vreemde (video)','gemiddeld',3,16),
('Laat een onbekende een NL-zin uitspreken (video)','gemiddeld',3,17),
('Groepsfoto met 10 onbekenden','gemiddeld',3,18),
('Win een potje beachvolleybal van onbekenden (video)','gemiddeld',3,19),
('Laat 5 onbekenden voor je juichen (video)','gemiddeld',3,20),
('Doe 50 push-ups op het strand (video)','gemiddeld',3,21),
('Laat een onbekende je beste vriend bellen en zeg dat je niet meer thuiskomt (video)','gemiddeld',3,22),
('Video dat je 3 atjes achter elkaar neemt','gemiddeld',3,23),
('Krijg iemands telefoonnummer (screenshot bewijs)','gemiddeld',3,24),
('Win een arm-wrestle van een onbekende (video)','gemiddeld',3,25),
('Doe een shotje met onbekenden en proost in hun taal (video)','gemiddeld',3,26),
('Doe de worm op de dansvloer (video)','gemiddeld',3,27),
('Eet een hele citroen op zonder gezicht trekken (video)','gemiddeld',3,28),
('Drink 5 shotjes in 1 minuut (video)','gemiddeld',3,29),
('Laat een onbekende een tattoo op je tekenen met stift (foto)','gemiddeld',3,30),
('Daag een onbekende uit voor een ad-wedstrijd en win (video)','gemiddeld',3,31),
('Doe een handstand op het strand voor 30 seconden (video)','gemiddeld',3,32),
('Ruil een kledingstuk met een onbekende (foto)','gemiddeld',3,33),
('Maak een onbekende aan het lachen binnen 10 seconden (video)','gemiddeld',3,34),
('Neem een bad onder een stranddouche alsof het je eigen douche is (video)','gemiddeld',3,35),
-- HEFTIG 5pt (23)
('Polonaise met 15 mensen (video)','heftig',5,36),
('Mini-dansbattle met een onbekende (video)','heftig',5,37),
('Karaoke op een podium (video)','heftig',5,38),
('Krijg een gratis drankje van een onbekende (video)','heftig',5,39),
('Trek met 20 mensen een atje (video)','heftig',5,40),
('Spring in een random zwembad dat niet van jou is (video)','heftig',5,41),
('Krijg een kus op je wang van 2 dames tegelijk (foto)','heftig',5,42),
('Laat je optillen door een onbekende (foto)','heftig',5,43),
('Spring met kleren aan in het zwembad (video)','heftig',5,44),
('Klim ergens op een dak of balkon waar je eigenlijk niet mag komen (foto)','heftig',5,45),
('Dans op een tafel in een bar (video)','heftig',5,46),
('Doe een belly flop in het zwembad (video)','heftig',5,47),
('Loop met een onbekende dame op je nek (video)','heftig',5,48),
('Drink een hele pitcher bier alleen (video)','heftig',5,49),
('Ga op het podium bij een bar en geef een speech (video)','heftig',5,50),
('Doe 100 squats op de strip (video)','heftig',5,51),
('Drink een mix van 5 drankjes in 1 glas (video)','heftig',5,52),
('Ga op je knieen en vraag een onbekende dame ten huwelijk (video)','heftig',5,53),
('Organiseer een drinkspel met een andere groep (video)','heftig',5,54),
('Laat een hele tafel Nederland scanderen (video)','heftig',5,55),
('Bier-estafette: 4 biertjes relay met je team (video)','heftig',5,56),
('Laat je benen scheren door je teamgenoot (video)','heftig',5,57),
('Ga 5 minuten als zwerver op de strip zitten met een kartonnen bordje en kijk hoeveel je ophaalt (video)','heftig',5,58),
-- LEGENDARISCH 10pt (17)
('Iemand uit de groep zingt live op een podium (video)','legendarisch',10,59),
('Ren in je onderbroek over de strip (video)','legendarisch',10,60),
('Duik in de oceaan in je onderbroek om 6 uur s ochtends (video)','legendarisch',10,61),
('Spring vanaf de hoogste plek die je kunt vinden in een zwembad (video)','legendarisch',10,62),
('Ga achter de bar staan en schenk een drankje met toestemming (video)','legendarisch',10,63),
('Laat een hele bar meezingen met het Wilhelmus (video)','legendarisch',10,64),
('Word op de schouders genomen door een menigte (video)','legendarisch',10,65),
('Organiseer een mass jump: spring met min. 5 onbekenden tegelijk de oceaan in (video)','legendarisch',10,66),
('Start een limbo-contest met min. 10 deelnemers (video)','legendarisch',10,67),
('Neem het podium over in een club en MC minimaal 1 minuut (video)','legendarisch',10,68),
('Drink een biertoren (3L buis) met je team in onder 5 minuten (video)','legendarisch',10,69),
('Doe een belly shot van de buik van een onbekende (video)','legendarisch',10,70),
('Start een polonaise die door minstens 3 bars loopt zonder te stoppen (video)','legendarisch',10,71),
('Krijg VIP of backstage toegang bij een club (foto bewijs)','legendarisch',10,72),
('Laat een hele bar een shotje nemen op jouw commando (video)','legendarisch',10,73),
('Ga op het podium in een club en strip tot je onderbroek (video)','legendarisch',10,74),
('Ga skinny-dippen in de oceaan na middernacht (video)','legendarisch',10,75)
on conflict do nothing;
