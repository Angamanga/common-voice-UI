# Common Voice Recording App

A Vue 3 interface for recording voice clips and contributing to the [Mozilla Common Voice](https://commonvoice.mozilla.org) dataset.

## What it does

- Fetches sentences from the Common Voice API in batches of 5
- Records audio via the browser's MediaRecorder API (WebM/OGG, max 15 seconds)
- Uploads recordings as multipart form data
- Supports English, Swahili, and Swedish (sv-SE)
- Persists user identity and per-language sentence offsets in localStorage so returning users pick up where they left off

## Setup

### 1. Get API credentials

Register at [commonvoice.mozilla.org](https://commonvoice.mozilla.org) and obtain a client ID and secret.

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```
VITE_CV_CLIENT_ID=your_client_id_here
VITE_CV_CLIENT_SECRET=your_client_secret_here
```

### 3. Install and run

```bash
npm install
npm run dev
```

The dev server proxies `/cv-api` → `https://api.commonvoice.mozilla.org` to avoid CORS issues.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run TypeScript checks without building |

## Tech stack

- [Vue 3](https://vuejs.org) (Composition API + `<script setup>`)
- [Pinia](https://pinia.vuejs.org) for state management
- [Vue Router](https://router.vuejs.org)
- [Axios](https://axios-http.com) with Bearer token interceptor
- [Vite](https://vitejs.dev)
