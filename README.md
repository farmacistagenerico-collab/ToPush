# FarmaCromia 🟢🟡🟠🔴

> **Sistema di Consiglio e Gestione Giacenze a Semaforo Cromatico per Farmacie**  
> *Semplifica il cross-selling, l'upselling etico e gli obiettivi di reparto senza alcuna pressione numerica per i farmacisti collaboratori.*

---

## 💡 Il Contesto & La Filosofia

Nella farmacia moderna, il banco vendita si evolve sempre più da semplice dispensazione di ricette a **luogo di consiglio professionale e salute attiva**. Tuttavia, la gestione tradizionale degli obiettivi commerciali (target in pezzi, quote di fatturato, fogli Excel) genera spesso **ansia, rifiuto psicologico o attrito** nei farmacisti collaboratori e dipendenti, che hanno una formazione clinico-sanitaria e rifiutano l'approccio da "venditore aggressivo".

**FarmaCromia rivoluziona questo paradigma eliminando del tutto numeri e conti dallo schermo del banco**, sostituendoli con un codice colore universale a semaforo:

| Colore | Significato Operativo | Azione al Banco Vendita |
| :--- | :--- | :--- |
| 🔴 **Rosso** | **Priorità Massima** *(Da far fuori subito)* | Giacenze elevate di magazzino, accordi commerciali prioritari o scadenze ravvicinate. Da proporre sistematicamente con le prescrizioni compatibili. |
| 🟠 **Arancio** | **In Consiglio Attivo** | Referenze al centro della rotazione stagionale. Da consigliare regolarmente con i sintomi o bisogni riferiti dal cliente. |
| 🟡 **Giallo** | **Quasi al Traguardo** | Rotazione a buon punto. Ultimo sprint dello staff per chiudere il lotto prefissato. |
| 🟢 **Verde** | **Traguardo Raggiunto!** | Obiettivo completato con successo. Lo staff rilassa la spinta sul prodotto e si concentra sui colori più caldi. Zero sensi di colpa. |

---

## ✨ Funzionalità Principali

- 🎯 **Dashboard Banco 100% Zero-Numeri**: Il collaboratore visualizza solo il colore a semaforo, il **gancio clinico** (*«Quando proporlo»*), i **punti di forza** e le **associazioni frequenti** (es. Antibiotico ➔ Fermenti Vivi; Antinfiammatorio ➔ Gastroprotettore).
- ⚡ **Pulsante Rapido 1-Tap `[+ Consigliato]`**: Lo staff registra il consiglio erogato con un tocco immediato e feedback visivo rassicurante.
- 📋 **Doppia Modalità Visiva**:
  - **Solo Lista Semplice**: Layout compatto ad altissima densità per monitor di cassa o schermi touch.
  - **Schede Dettagliate**: Schede complete con drawer espandibile per approfondimenti clinici.
- 🗂️ **Multi-Lista Totalmente Personalizzabile**:
  - Crea nuove liste con qualsiasi nome (es. `Consiglio Autunno/Inverno`, `Focus Antibiotici & Difese`, `Promozione Dermocosmesi`).
  - Rinomina le liste in 1 secondo direttamente con la matita inline.
  - Imposta la cadenza: **Settimanale** (7 gg), **Bisettimanale** (14 gg), **Mensile** (30 gg) o **Stagionale**.
  - Selettore rapido: un click attiva la lista per tutti i terminali della farmacia.
- 📲 **Sincronizzazione Real-Time (Mobile & Desktop)**: Architettura con **Server-Sent Events (SSE)**. Se un farmacista registra un consiglio da smartphone in tasca al camice, tutti i computer del banco si aggiornano in tempo reale.
- 📥 **Importatore Massivo CSV**: Incolla direttamente righe da Excel o gestionali di farmacia (Farmadati, Wingesfar, CSFarma) con anteprima automatica.
- 🛡️ **Pannello Titolare Riservato**: Solo chi gestisce la farmacia può visualizzare le quantità interne, le scadenze e forzare i colori con un clic.
- 📖 **Prontuario Clinico di Cross-Selling Integrato**: 10 abbinamenti farmacologici standard con la frase naturale consigliata da pronunciare al paziente.

---

## 🚀 Guida all'Installazione & Avvio

### Prerequisiti
- **Node.js** versione 18.0 o superiore
- **npm** versione 9.0 o superiore

### 1. Clona il Repository
```bash
git clone https://github.com/tuo-username/farmacromia.git
cd farmacromia
```

### 2. Installa le Dipendenze
```bash
npm install
```

### 3. Avvia in Ambiente di Sviluppo
```bash
npm run dev
```
Apri il browser su [http://localhost:3000](http://localhost:3000).

### 4. Build per la Produzione
```bash
npm run build
npm start
```

---

## 🛠️ Come Personalizzare per la Tua Farmacia (In Bianco)

1. **Avvio in Bianco**:
   All'avvio, il portale include la struttura pronta da personalizzare. Puoi cliccare su **`Area Titolare` ➔ `In Bianco (Template)`** per azzerare e iniziare con una lista pulita.
2. **Crea la Tua Prima Lista**:
   - Clicca su **`+ Crea Nuova Lista`**.
   - Assegna il nome (es. `Consiglio Autunno/Inverno 2026`).
   - Seleziona la cadenza e attiva la lista per il banco.
3. **Aggiungi i Prodotti o Importa via CSV**:
   - Puoi aggiungere i prodotti manualmente con il pulsante **`+ Aggiungi Prodotto`**.
   - Oppure puoi andare nella scheda **`Caricamento Massivo CSV`** e incollare il formato:
     ```csv
     Nome; Marchio; Categoria; Trigger al Banco; Target; Colore; Motivo
     FlorBio Fermenti; BioFarma; Fermenti; Con antibiotici; 40; red; Giacenza alta
     DermoHydra Crema; SkinLab; Dermocosmesi; Mani screpolate; 30; orange; Focus stagionale
     ```
4. **Condividi l'URL tra i Banchi**:
   Apri lo stesso indirizzo su tutti i monitor del banco, sui tablet o sugli smartphone dello staff: la sincronizzazione è istantanea!

---

## 📁 Struttura del Progetto

```
farmacromia/
├── server.ts                       # Server Express full-stack con Server-Sent Events (SSE) e REST API
├── data/
│   └── .gitkeep                    # Cartella di persistenza runtime locale (i dati json sono in .gitignore)
├── src/
│   ├── types.ts                    # Tipi TypeScript, semafori cromatici e interfacce
│   ├── services/
│   │   └── api.ts                  # Client API e listener SSE in tempo reale
│   ├── components/
│   │   ├── TopNav.tsx              # Barra superiore conforme al contratto 3-zone
│   │   ├── ListSelectorBar.tsx     # Selettore, rinomina e switch liste attive
│   │   ├── CreateListModal.tsx     # Wizard per creare e personalizzare nuove liste
│   │   ├── CounterStaffView.tsx    # Schermata operativa del banco senza numeri
│   │   ├── SimpleProductList.tsx   # Modalità visuale "Solo Lista Semplice" compatta
│   │   ├── ProductCard.tsx         # Scheda prodotto cromatico con gancio al banco
│   │   ├── ManagerDashboard.tsx    # Pannello di controllo riservato al titolare
│   │   ├── CrossSellingGuideModal.tsx # Prontuario interattivo di consiglio clinico
│   │   └── MethodExplainerModal.tsx # Guida al metodo e alla psicologia collaboratori
│   ├── App.tsx                     # Componente radice React con gestione viste e notifiche
│   ├── main.tsx                    # Entry point React 19
│   └── index.css                   # Tailwind CSS v4 con Plus Jakarta Sans
├── index.html                      # Entry point HTML con metadati
├── package.json                    # Dipendenze ed scripts
├── tsconfig.json                   # Configurazione TypeScript
└── vite.config.ts                  # Configurazione Vite
```

---

## 🔒 Sicurezza e Riservatezza dei Dati

- Il file di dati locale `data/pharmacy_store.json` è inserito in `.gitignore`, per garantire che i lotti, i prezzi o i dati interni della farmacia **non vengano mai caricati accidentalmente su GitHub**.
- I numeri, le quantità di giacenza e le quote target sono criptati/visibili unicamente all'interno della vista protetta del titolare.

---

## 📄 Licenza

Rilasciato sotto licenza [MIT](LICENSE). Libero per l'utilizzo, la personalizzazione e l'adozione in tutte le farmacie territoriali ed ospedaliere.
