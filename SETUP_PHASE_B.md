# Setup Guide - Chat AI + Notifiche Email

Questa guida copre **solo** le nuove funzionalità Fase A (Flow Builder) e Fase B (Chat AI + Notifiche).

## 🚀 Avvio rapido

```bash
npm install
npm run dev
```

Apri `http://localhost:5173/admin` (la dashboard).

## 🔑 Configurazione API Keys

Tutte le API keys si configurano dalla **dashboard → Sistema → Impostazioni & API**, NON in file `.env`. Vengono salvate in Firestore (collection `appSettings`, doc `global`).

### 1. Anthropic API Key (per Chat AI)

1. Vai su https://console.anthropic.com/
2. Crea una API key (formato `sk-ant-api03-...`)
3. Incollala in **Impostazioni → API Keys → Anthropic**
4. Modello consigliato: `claude-haiku-4-5-20251001` (economico, ~$0.25/M token)

### 2. Resend API Key (per Email)

1. Vai su https://resend.com/ (gratis fino a 3000 email/mese)
2. Verifica un dominio mittente (DNS: SPF, DKIM, DMARC)
3. Crea una API key (formato `re_...`)
4. Incollala in **Impostazioni → API Keys → Resend**
5. In **Impostazioni → Email Provider** imposta:
   - Nome mittente (es. "Studio Dentistico")
   - Email mittente (deve essere del dominio verificato)
   - Reply-to (opzionale)

> ⚠️ **Senza dominio verificato** puoi solo usare `onboarding@resend.dev` (per test).

### 3. Firebase Service Account (per gli endpoint serverless)

Gli endpoint `/api/chat` e `/api/send-email` girano lato server e devono leggere le impostazioni da Firestore con `firebase-admin`. Serve un service account.

1. Vai su Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" → scarica il JSON
3. Su Vercel: **Settings → Environment Variables**
4. Aggiungi:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: incolla l'INTERO JSON come stringa (su una riga)
5. Redeploy

## 🌐 Deploy su Vercel

```bash
npm i -g vercel
vercel
```

Vercel rileva automaticamente:
- Il frontend Vite → build statico
- La cartella `/api` → serverless functions

Le rewrites in `vercel.json` sono configurate per:
- `/api/*` → serverless function corrispondente
- Tutto il resto → SPA (index.html)

## 🧠 Architettura Chat AI

```
Browser (ChatWidget)
    ↓ POST /api/chat { botId, messages }
Vercel Serverless (api/chat.ts)
    ↓ legge bot da Firestore
    ↓ legge settings (API key) da Firestore
    ↓ costruisce system prompt dinamico
    ↓ chiama Anthropic Claude Haiku
    ↓ estrae <META>{...}</META> dalla risposta
    ↓ ritorna { reply, meta }
Browser
    ↓ Aggiorna UI, classifica lead, suggerisce CTA
```

### Modalità test (senza API key)

Senza la chiave Anthropic, la chat ritorna messaggi di stub. Utile per testare l'interfaccia prima di pagare.

## ✉️ Architettura Notifiche

```
Evento (form_submitted, chat_data_left, ...)
    ↓ trovato regola corrispondente
    ↓ POST /api/send-email
Vercel Serverless (api/send-email.ts)
    ↓ legge Resend key da Firestore
    ↓ se key esiste → invia con Resend
    ↓ se key NON esiste → log con status="stub"
    ↓ salva log in Firestore (notificationLogs)
```

### Modalità stub

Se Resend non è configurato, ogni notifica genera un log con `status: "stub"` visibile in **Notifiche → Storico**. Utile per testare il sistema di trigger senza email reali.

## 🎯 Flow di lavoro tipico

1. **Sistema → Impostazioni**: imposta dati studio, API keys, dashboard URL
2. **Engagement → Chat AI**: crea un bot, configura tono e CTA, attivalo per una landing
3. **Engagement → Notifiche**: crea regola "Nuova lead da chat" con email destinatario
4. **Builder → Landing Pages**: la chat appare automaticamente sulla landing
5. **Test**: visita la landing, chatta, lascia dati → ricevi email
6. **CRM → Lead**: vedi i lead arrivati con tag e classificazione
7. **Engagement → Chat AI → Conversazioni**: storico completo delle chat

## 🛠 Componenti chiave

| File | Cosa fa |
|------|---------|
| `api/chat.ts` | Endpoint serverless per AI |
| `api/send-email.ts` | Endpoint serverless per email |
| `src/lib/apiClient.ts` | Client browser per chiamare gli endpoint |
| `src/lib/chatService.ts` | CRUD Firestore per chatBots e chatConversations |
| `src/lib/notificationService.ts` | CRUD regole/log + matching + template render |
| `src/lib/settingsService.ts` | CRUD impostazioni globali |
| `src/components/chat/ChatWidget.tsx` | Widget visibile sulle landing |
| `src/components/chat/ChatBotsManager.tsx` | UI per configurare i bot |
| `src/components/notifications/NotificationsManager.tsx` | UI regole + log |
| `src/components/settings/SettingsManager.tsx` | UI API keys + dati studio |
| `src/components/flow/FlowCanvas.tsx` | Canvas React Flow |

## ⚠️ Sicurezza

- **API keys MAI esposte al browser**: tutte le chiamate ad Anthropic e Resend passano dagli endpoint serverless lato server.
- Le keys salvate in Firestore (collection `appSettings`) devono avere regole di sicurezza che permettono lettura solo agli admin autenticati.
- Le serverless function leggono le keys con `firebase-admin` (bypassa le security rules, perché gira lato server).

## 📚 Variabili Template Email

Disponibili in oggetto e corpo:

```
{{nome}}, {{cognome}}, {{telefono}}, {{email}}
{{landing}}, {{funnel}}, {{servizio}}
{{livello_funnel}}, {{stato}}, {{tag}}
{{risposte_chat}}, {{riepilogo_chat_o_risposte}}
{{azione_consigliata}}, {{data}}
{{privacy}}, {{marketing}}
{{link_dashboard}}
```
