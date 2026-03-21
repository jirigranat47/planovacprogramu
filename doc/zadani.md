# 1. Přehled projektu
**Produkt:** Webová a mobilní aplikace pro agilní plánování skautských akcí.
**Problém k řešení:** Statické tabulky (Excel) neumožňují rychlou změnu programu v terénu bez rozbití celého časového sledu.
**Cílová skupina:** Skautští vedoucí vyžadující nástroj pro přípravu akce (desktop) a operativní řízení na místě (mobil).

# 2. Architektura dat a Funkcionality
### A. Jádro: Dynamická Timeline (Časová osa)
*   **Grid systém:** Časová osa s nastavitelným měřítkem (např. 15/30/60 min sloty).
*   **Objekt "Karta aktivity":** Datový objekt obsahující:
    *   *Povinné:* Název, čas začátku, trvání (minuty).
    *   *Metadata:* Kategorie (barevné odlišení), lektor/zodpovědná osoba, popis.
    *   *Externí vazby:* Pole pro URL (odkaz na Google Drive s metodikou).
    *   *Sub-tasky:* Checklist úkolů pro daný blok (např. "připravit lana", "rozdat šátky").
*   **Interakce:** Plný Drag & Drop pro přesun v čase i mezi paralelními linkami. Změna délky bloku tažením za spodní okraj karty.

### B. Paralelní linky a Multi-track
*   **Hierarchie:** Možnost definovat paralelních linek (proudy programu pro různé věkové skupiny/družiny).
*   **Synchronizační body (Anchor Points):** Speciální typ bloku přes celou šířku všech linek (nástup, jídlo, večerka). Pokud se pohne se sdíleným bodem, posune se čas u všech linek zároveň.

### C. Inteligentní logika (Smart Engine)
*   **Smart Gaps:** Algoritmus detekuje prázdná místa (hluchá místa) v harmonogramu.
    *   Vizuální indikace "Díry v programu".
    *   Context menu: "Vyplnit volným časem" nebo "Prodloužit předchozí blok až k dalšímu".
*   **Ripple Effect (Vlnový efekt):** Při prodloužení bloku se automaticky posunou startovní časy všech následujících bloků tak, aby nevznikaly překryvy.

### D. Správa času a Kalendář
*   **Kontext akce:** Uživatel definuje přesné datum a čas začátku (např. pátek 17:00) a konce (např. neděle 14:00). Aplikace vygeneruje příslušný počet denních sloupců.
*   **Šablony:** Možnost uložit celou strukturu (např. "Vzorová víkendovka") a importovat ji do nového data.

# 3. UI/UX a Technické parametry
### Uživatelské rozhraní
*   **Desktop:** Dvoupanálové zobrazení – vlevo seznam nepřiřazených aktivit ("zásobník"), vpravo hlavní timeline.
*   **Mobil:** "View-only" nebo "Lite-edit" mód. Priorita na čitelnost na slunci a snadné odškrtávání checklistů u aktivit.
*   **Vizuální styl:** Přehledný, čistý, s použitím skautské symboliky/barev (každá kategorie programu má svou barvu).

### Technické nároky
*   **Offline First:** Využití Service Workers / LocalStorage. Program musí být dostupný i v lese bez signálu (PWA - Progressive Web App).
*   **Exportní modul:**
    *   *PDF:* Generování tiskové verze optimalizované na formát A4 (na šířku).
    *   *Image:* Export pro rychlé sdílení do WhatsApp/Messenger skupin.
    *   *Share Link:* Unikátní URL pro náhled bez nutnosti registrace.

# 4. Uživatelské scénáře (User Stories) k implementaci
1.  **Jako vedoucí** chci přetáhnout "noční hru" ze soboty na pátek, aniž by mi v sobotu zůstala prázdná díra a v pátek se mi bloky překryly.
2.  **Jako hospodář** chci vidět u každého bloku seznam úkolů, abych věděl, kdy mám nachystat dřevo na oheň.
3.  **Jako uživatel** chci v mobilu kliknout na odkaz v kartě aktivity a nechat se přesměrovat na PDF s pravidly hry na Google Disku.
