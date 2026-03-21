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
*   **Activity (Karta aktivity):** ID, track_id, název, start_time, duration, popis, url, metadata (kategorie).
*   **Subtask (Checklist):** ID, activity_id, text, is_done.
*   **AnchorPoint (Synchronizační bod):** ID, event_id, název, start_time (ovlivňuje všechny linky).

---

## 3. Fáze vývoje (Roadmapa)

### Fáze 1: Základní infrastruktura a MVP (Desktop)
*   Nastavení Docker prostředí a Railway pipeline.
*   Základní UI: Dvoupanelové zobrazení (zásobník vs. timeline).
*   Implementace základní timeline s fixním gridem.
*   Vytváření, editace a mazání aktivit.

### Fáze 2: Inteligentní logika (Smart Engine)
*   Implementace **Drag & Drop** přesunů.
*   **Ripple Effect:** Algoritmus pro posun navazujících aktivit při změně trvání.
*   **Smart Gaps:** Detekce děr a kontextové menu pro jejich vyplnění.
*   **Anchor Points:** Logika pro hromadný posun všech linek (jídlo, nástup).

### Fáze 3: Mobilní verze a Offline (PWA)
*   Optimalizace UI pro mobilní zařízení (Lite-edit mód).
*   Implementace Service Workers pro offline přístup.
*   Lokální ukládání změn do IndexedDB a následná synchronizace po návratu na signál.
*   Interaktivní checklisty u aktivit.

### Fáze 4: Export a Šablony
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
