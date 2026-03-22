# Nasazení aplikace na Railway

Tento dokument popisuje kroky potřebné pro úspěšný deployment "Skautského plánovače" na platformu Railway a bezpečný způsob správy databáze.

## 1. Příprava Projektu

Aplikace je Next.js projekt využívající **NextAuth (v5)** a **Prisma**. Pro Railway je důležité mít správně nastavené scripts v `package.json` (což již máme):
- `build`: `next build`
- `start`: `next start`
- `postinstall`: `prisma generate` (zajistí vygenerování Prisma klienta po instalaci závislostí)

## 2. Proměnné prostředí na Railway

V nastavení projektu na Railway (Variable tab) je nutné nakonfigurovat tyto proměnné:

| Proměnná | Popis |
| :--- | :--- |
| `DATABASE_URL` | Připojovací řetězec k PostgreSQL (Railway ho vygeneruje automaticky po přidání Database pluginu) |
| `AUTH_SECRET` | Libovolný tajný řetězec pro šifrování session (vygenerujte např. přes `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Získané z Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Získané z Google Cloud Console |
| `NEXTAUTH_URL` | Veřejná URL vaší aplikace na Railway (např. `https://skaut-planovac.up.railway.app`) |

## 3. Strategie správy databáze (Migrace)

Doposud jsme používali příkaz `npx prisma db push`, který "násilně" srovná schéma s DB. To je skvělé pro vývoj, ale **nebezpečné pro produkci**, protože může dojít ke ztrátě dat při změně typu sloupce apod.

### Přechod na Migrace (Verzování)

Odteď budeme postupovat takto:

1. **Lokální vývoj:** Když změníte `schema.prisma`, místo `db push` použijte:
   ```bash
   npx prisma migrate dev --name pridani_noveho_pole
   ```
   Tento příkaz vytvoří v projektu složku `prisma/migrations`, kde je uložen SQL skript změny. Tento soubor **musíte commitnout do Gitu**.

2. **Produkce (Railway):** Při deploymentu Railway automaticky detekuje nové soubory migrací. Aby se aplikovaly na Railway DB bezpečně, upravte build command na Railway na:
   ```bash
   npx prisma migrate deploy && next build
   ```
   Příkaz `migrate deploy` spustí pouze ty SQL skripty, které v DB ještě neběžely, bez rizika smazání existujících dat.

## 4. Postup v Railway konzoli

1. Klikněte na **+ New** -> **GitHub Repo** a vyberte váš projekt.
2. Klikněte na **+ New** -> **Database** -> **Add PostgreSQL**.
3. Railway automaticky propojí aplikaci s databází (pokud ne, zkopírujte `DATABASE_URL` z DB nastavení do proměnných aplikace).
4. V záložce **Settings** u webové služby zkontrolujte, že se Next.js detekoval a generuje veřejnou doménu.
5. Vložte zbývající tajné klíče (`AUTH_SECRET`, atd.) do sekce **Variables**.

Aplikace by se měla automaticky sestavit a spustit.
