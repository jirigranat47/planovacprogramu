# Skautský Plánovač Programu

Webová a mobilní aplikace pro agilní plánování skautských akcí s podporou offline režimu (PWA).

## 🚀 Rychlý start (Docker)

Aplikace je plně kontejnerizovaná a připravená pro lokální vývoj.

1. **Sestavení a spuštění:**
   ```bash
   docker-compose up --build
   ```

2. **Inicializace databáze (nutné při prvním spuštění):**
   ```bash
   docker-compose exec app npx prisma db push
   docker-compose exec app npx tsx prisma/seed.ts
   ```

3. **Aktualizace databáze (migrace):**
   Pokud se změní schéma (např. po `git pull`), aplikujte migrace:
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

4. **Řešení potíží s Dockerem (pokud npm run dev v kontejneru hází chyby):**
   Pokud jste přidávali nové balíčky a Docker je "nevidí", je potřeba smazat anonymní volumes pro `node_modules`:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

3. **Přístup:**
   - Web: `http://localhost:3000`
   - DB: `localhost:5432` (user: password, db: planaer_db)

## 🧪 Testovací přístupy

Pro usnadnění vývoje a testování byl vytvořen testovací účet:
- **Email:** `antigravity@test.cz`
- **Heslo:** `Password123!`
- **Jméno:** `Antigravity AI`

## 🛠 Technologický Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM (v6.19.2)
- **Databáze:** PostgreSQL (v15)
- **Infrastruktura:** Docker, Railway.com (připraveno pro deployment)

## 📂 Struktura projektu

- `src/app`: Stránky a API routy (Next.js App Router)
- `src/lib`: Sdílené utility (Prisma klient)
- `src/types`: TypeScript rozhraní pro datový model
- `prisma/`: Schéma databáze a seedovací skript
- `doc/`: Původní zadání a analýza

## ✅ Aktuální stav (MVP v1)

- [x] Základní UI (dvoupanelové zobrazení)
- [x] Napojení na PostgreSQL přes Prisma
- [x] API pro načítání akcí a přidávání aktivit
- [x] Zásobník pro nepřiřazené aktivity
- [ ] Drag & Drop (rozpracováno)
- [ ] Ripple Effect (posun navazujících aktivit)
- [ ] Offline podpora (PWA)
