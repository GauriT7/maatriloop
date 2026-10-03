[README.md](https://github.com/user-attachments/files/33004970/README.md)
# MaatriLoop

**Close every care loop.**

MaatriLoop is a non-clinical maternal-care workflow and coordination layer. It keeps operational tasks visible, owned, communicated and moving between doctors, frontline workers and patients.

## v0.3 — Sarvam integration

This version adds an integration-ready Sarvam gateway for:

- **Speech-to-text:** short frontline voice notes → Sarvam Saaras v4 → transcript → deterministic workflow-event extraction → human review.
- **Translation:** approved workflow text → Sarvam Translate → Marathi/Hindi/English.
- **Text-to-speech:** approved translated text → Sarvam Bulbul v3 → playable audio.
- **Code-mixed speech:** the voice flow can use Saaras `codemix` mode for Indian-language + English operational speech.

Sarvam is a supporting communication layer. It is **not** the source of truth and does not diagnose, prescribe, recommend treatment, score clinical risk or make clinical decisions.

## Architecture

```text
Doctor / Frontline / Patient
          ↓
    MaatriLoop workflow
          ↓
 Tasks + appointments + communication
          ↓
    Sarvam gateway
     ↙      ↓      ↘
   STT   Translate   TTS
     \      ↓      /
      Human review
          ↓
      Workflow event
          ↓
       Audit trail
```

## Important security rule

Never put `SARVAM_API_KEY` in `App.jsx`, Vite client code, GitHub Pages, or any browser-exposed variable.

The key belongs only on the backend as `SARVAM_API_KEY`.

The frontend uses only the public `VITE_API_BASE_URL` to reach the backend.

## Local development

### Frontend

```bash
npm install
npm run dev
```

Set:

```text
VITE_API_BASE_URL=http://localhost:8787
```

### Backend

```bash
cd server
npm install
npm start
```

Backend environment:

```text
SARVAM_API_KEY=your_key
FRONTEND_ORIGIN=http://localhost:5173
PORT=8787
```

## Deploying the backend

The repository includes `render.yaml` for a small Node gateway deployment. After deploying the backend, add:

```text
SARVAM_API_KEY=<your Sarvam key>
FRONTEND_ORIGIN=https://gaurit7.github.io
```

Then set the GitHub Pages build variable:

```text
VITE_API_BASE_URL=https://<your-backend-domain>
```

The frontend falls back to a safe demo mode if this variable is absent.

## Synthetic data only

The prototype uses synthetic demo patients. Do not put real patient health information into this repository or into third-party AI APIs until authentication, RBAC, encryption, audit logging, retention/deletion controls, consent/privacy processes and appropriate healthcare data governance are established.
