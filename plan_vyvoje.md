# Plán vývoje: Skautský Plánovač Programu

Tento dokument slouží jako detailní rozbor a roadmapa pro vývoj webové a mobilní aplikace určené k operativnímu plánování skautských akcí.

## 1. Technologický stack

Vzhledem k požadavkům na **Offline First**, **PWA** a náročnou interaktivitu (Drag & Drop, Ripple Effect) navrhuji následující technologie:

### Frontend
*   **Framework:** Next.js (React) - vynikající podpora pro PWA a rychlé načítání.
*   **Styling:** Tailwind CSS - pro rychlý a konzistentní vizuální styl se skautskou symbolikou.
*   **Timeline & D&D:** `dnd-kit` nebo `react-beautiful-dnd` pro plynulé přesuny aktivit.
*   **State Management:** TanStack Query (SWR) pro synchronizaci dat a Zustand pro lokální stav timeline.
*   **Offline:** `next-pwa` (Service Workers) + IndexedDB (přes `dexie`) pro ukládání dat v lese bez signálu.

### Backend & Infrastruktura
*   **Jazyk:** Node.js (TypeScript) - sdílení typů mezi FE a BE.
*   **Databáze:** PostgreSQL - robustní relační data (aktivity, linky, šablony).
*   **Kontejnerizace:** Docker - pro lokální vývoj i nasazení.
*   **Nasazení:** Railway.com - automatický deployment z GitHubu, snadná správa DB.

---

## 2. Návrh datového modelu

Základní entity:
*   **Event (Akce):** ID, název, start_time, end_time, metadata.
*   **Track (Linka):** ID, event_id, název (např. "Vlčata"), barva.
*   **Activity (Karta aktivity):** ID, track_id, název, start_time, duration, popis, url (odkaz na metodiku), metadata (kategorie, lektor/zodpovědná osoba).
*   **Subtask (Checklist):** ID, activity_id, text, is_done.
*   **AnchorPoint (Synchronizační bod):** ID, event_id, název, start_time (ovlivňuje všechny linky).

---

## 3. Fáze vývoje (Roadmapa)

### Fáze 1: Základní infrastruktura a MVP (Hotovo ✅)
*   [x] Nastavení Docker prostředí (PostgreSQL + Next.js).
*   [x] Inicializace Next.js s TypeScriptem a Tailwind CSS.
*   [x] Dvoupanelové UI (Zásobník vs. Timeline).
*   [x] Napojení na PostgreSQL přes Prisma.
*   [x] API pro načítání akcí a aktivit.
*   [x] Formulář pro přidávání aktivit do zásobníku.

### Fáze 2: Inteligentní logika a Administrace (Probíhá ⏳)
*   [x] **Základní D&D:** Přesun ze zásobníku do timeline a mezi linkami.
*   [x] **Resize:** Možnost natáhnout/zkrátit délku bloku tažením za okraj.
*   [x] **Ripple Effect:** Automatický posun navazujících aktivit při změně času/trvání.
*   [x] **Vizuální zpětná vazba:** Ukazatel cílového času při přetahování.
*   [x] **Detailní správa aktivit (Modální okno):**
    *   [x] **Editace textů:** Změna názvu a podrobného popisu aktivity.
    *   [x] **Časové určení:** Možnost zadat přesný čas "Od" a "Do" (automatický přepočet trvání).
    *   [x] **Metadata:** Výběr kategorie (Program, Strava, Přesun...), zodpovědná osoba, URL odkaz na metodiku.
    *   [x] **Checklist:** Přidávání a odškrtávání podúkolů přímo v detailu aktivity.
*   [/] **Správa linek (Tracks):**
    *   [x] **Přidávání/Odebírání:** Tlačítka pro správu paralelních programových proudů.
    *   [x] **Editace linek:** Přejmenování linky a změna její unikátní barvy.
    *   [ ] **Řazení linek:** Možnost měnit vertikální pořadí linek na timeline.
*   [x] **Nastavení akce (Event Settings):**
    *   [x] **Globální parametry:** Změna názvu akce, úprava celkového časového rozsahu (start/end date).
    *   [x] **Generování mřížky:** Dynamické překreslení timeline při změně datumu akce.
*   [x] **Dashboard v2:**
    *   [x] Vyhledávání a filtrace v seznamu akcí.
    *   [x] **Duplikace:** Vytvoření nové akce na základě existující (kopírování struktury a linek).
    *   [x] **Vizualizace spolupracovníků:** Zobrazení seznamu lidí (vlastník + editoři) na kartě akce ve formě avatarů s tooltipem jména.
    *   [x] Archivace starých akcí.
*   [ ] **Smart Gaps & Filling:** Kontextové menu pro rychlé vyplnění děr v programu.
*   [ ] **Anchor Points:** Globální synchronizační body pro hromadný posun linek.

### Fáze 3: Autentizace a Kolaborace (Hotovo 🛡️)
*   [x] **NextAuth integrace:** Podpora pro Google Login a vlastní účty (Credentials).
*   [x] **Uživatelské profily:** Základní správa (jméno, email, avatar) a widget na dashboardu.
*   [x] **Systém práv k akcím:**
    *   [x] Implementace Middleware pro ochranu stránek.
    *   [x] Izolace dat v API (uživatel vidí jen své akce).
    *   [x] Role OWNER/EDITOR/VIEWER.
*   [x] **Přiřazování osob:** Propojení uživatelů přidaných k akci s konkrétními aktivitami (Responsible Person - podpora více lidí).

### Fáze 4: Mobilní verze a Offline (PWA) (Budoucí 🗓️)
*   Optimalizace UI pro mobilní zařízení (Lite-edit mód).
*   Implementace Service Workers pro offline přístup.
*   Lokální ukládání změn do IndexedDB a následná synchronizace po návratu na signál.
*   Interaktivní checklisty u aktivit.

### Fáze 5: Export a Šablony
*   Generování PDF (A4 na šířku) - knihovna `react-pdf`.
*   Export do obrázku pro sdílení na sociálních sítích.
*   Systém šablon: Uložení existující akce jako vzoru a jeho import.

---

## 4. Instrukce pro lokální vývoj (Docker)

V kořeni projektu bude připraven `docker-compose.yml`:
*   `app`: Next.js aplikace běžící na portu 3000.
*   `db`: PostgreSQL instance.

Pro nasazení na **Railway** stačí propojit repozitář; Railway automaticky detekuje `Dockerfile` nebo `package.json` a spustí deployment.

---

## 5. Uživatelské scénáře k prioritizaci
1.  **Operativní změna:** Vedoucí posune "oběd" o 30 minut -> aplikace automaticky posune celý odpolední program všech družin (Ripple Effect + Anchor Point).
2.  **Příprava v terénu:** Hospodář si v lese odškrtává úkoly u aktivity "Táborák" i bez signálu.
3.  **Sdílení:** Vygenerování unikátního odkazu pro rodiče, kteří uvidí aktuální program bez nutnosti přihlášení.
