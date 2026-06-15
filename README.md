# 🌴 Albufeira Challenge

Een mobile-first PWA voor één dag challenges met je crew. Foto- en videobewijs, peer-voting,
live ranglijst, roulette, badges en een admin/jury-paneel. Geen App Store nodig: openen via
een link en toevoegen aan je beginscherm.

**Stack:** Next.js 14 · TypeScript · Tailwind · Supabase (+ Storage) · PWA

---

## 1. Lokaal opzetten

```bash
npm install
cp .env.local.example .env.local   # vul daarna je Supabase-gegevens in
npm run dev
```

Open http://localhost:3000

> Bij `npm run build` haalt Next de fonts (Bricolage Grotesque + Outfit) op bij Google Fonts.
> Zorg dat je build-omgeving internet heeft (Vercel heeft dit standaard).

---

## 2. Supabase opzetten

1. Maak een project op [supabase.com](https://supabase.com) (gratis tier is genoeg).
2. Ga naar **Project Settings → API** en kopieer:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Zet deze in `.env.local`. Kies ook je eigen `NEXT_PUBLIC_ADMIN_CODE` (standaard `ALBU2026`).
4. Ga naar **SQL Editor → New query**, plak de **volledige inhoud** van
   `supabase/schema.sql` en klik **Run**.

Dit maakt in één keer:
- alle tabellen (`players`, `challenges`, `submissions`, `votes`, `badges`, `roulette_spins`, `game_settings`)
- de `player_scores` view (live score)
- triggers: niet op je eigen inzending stemmen + auto goed/afkeuren bij 5 stemmen
- RLS-policies
- de 150 challenges en de speeltijd (spelers melden zichzelf aan met naam + teamnaam)
- de **`proofs`** storage-bucket (publiek, max 50 MB, alleen toegestane bestandstypes)

### Storage voor foto + video (zit al in het script)

Het SQL-script maakt de bucket en zet de limieten. Controleer eventueel in
**Storage → proofs → Configuration**:
- **Public bucket:** aan
- **File size limit:** `50 MB`
- **Allowed MIME types:** `image/jpeg, image/png, image/webp, video/mp4, video/quicktime, video/webm`

> **Belangrijk voor grote video's:** standaard staat de Supabase upload-limiet soms lager.
> Ga naar **Storage → Settings** en zet **Global file size limit** op minimaal `50 MB`
> (gratis tier ondersteunt dit). De bucket-limiet en de globale limiet moeten allebei ≥ 50 MB zijn.

Wil je de buckets-policy los nog checken: **Storage → Policies** moet voor `proofs`
read/insert/delete voor `anon` toestaan (zit in het script).

---

## 3. Deployen naar Vercel

1. Push de map naar een GitHub-repo.
2. Ga naar [vercel.com](https://vercel.com) → **Add New → Project** → kies de repo.
3. **Environment Variables zijn optioneel.** De Supabase-gegevens zitten al ingebakken
   in `src/lib/supabase.ts`, dus je hoeft niks in te stellen om te deployen. Wil je
   afwijken, dan kun je toevoegen:
   - `NEXT_PUBLIC_SUPABASE_URL` (anders de ingebakken waarde)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anders de ingebakken waarde)
   - `NEXT_PUBLIC_ADMIN_CODE` (anders standaard `ALBU2026`)
4. **Deploy.** Vercel detecteert Next.js automatisch.
5. Je krijgt een URL zoals `https://albufeira-challenge.vercel.app`.

### Op het beginscherm zetten (de "download")
- **iPhone (Safari):** deel-knop → *Zet op beginscherm*.
- **Android (Chrome):** menu (⋮) → *App installeren* / *Toevoegen aan startscherm*.

Deel de Vercel-link in de groepsapp. Iedereen kiest zijn naam en spelen maar.

---

## 4. Spelregels in de app

- **1 dag.** Start- en eindtijd stel je in via het admin-paneel (tab *Instellingen*).
- **150 challenges**, 4 niveaus: makkelijk (1), gemiddeld (3), heftig (5), legendarisch (10).
- **Bewijs** = foto (jpg/png/webp) of video (mp4/mov/webm), max 50 MB.
- **Voting:** elke andere speler kan goed-/afkeuren. **5x goedkeuren → automatisch punten.**
  Je kunt niet op je eigen inzending stemmen, en elke challenge dien je max 1x in.
- **Roulette:** 1 spin per speler, plus 1 extra spin per 5 goedgekeurde challenges. Kan bonus óf strafpunten geven.
- **Challenge van het uur:** admin zet er één in de spotlight → dubbele punten.
- **Admin** (code invoeren op startscherm) kan: goedkeuren, afkeuren, uploads verwijderen,
  scores aanpassen, challenges toevoegen, beste video bekronen, speeltijd instellen en het spel sluiten.
- **Eindscherm** toont de winnaar, het podium en wie als laatste eindigt (= straf 🍻).

---

## 5. Slechte verbinding

- De app-shell wordt gecachet door de service worker (PWA), dus hij opent ook bij matig bereik.
- Uploads en stemmen hebben automatische retries.
- Data ververst zichzelf elke 10–12 sec; er is ook een handmatige refresh.

---

## 6. Veiligheid & privacy

- Op het startscherm staat een verplichte akkoord-melding over privacy (alles is zichtbaar voor
  de groep) en de gedragsregels (geen illegale, gevaarlijke of respectloze opdrachten).
- Dit is een besloten groepsapp met een gedeelde anon-key. De spelintegriteit (1x indienen,
  niet op jezelf stemmen, 5-stemmen-drempel) wordt afgedwongen in de database via constraints en
  triggers. Voor een vriendengroep is dit prima; deel de link niet publiek.

---

## Structuur

```
src/
  app/
    page.tsx            # start: naamkeuze + privacy/veiligheid
    dashboard/          # score, ranglijst, acties, countdown, badges
    challenges/         # lijst + upload (foto/video)
    vote/               # peer-voting feed
    roulette/           # 1x draaien
    admin/              # jury + scores + instellingen
    results/            # eindscherm / winnaar
  components/           # Shell + BottomNav
  lib/                  # supabase client, types, data-laag, hooks, sessie
supabase/schema.sql     # database + storage in één script
```
