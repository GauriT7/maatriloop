[MaatriLoop-v0.7-README.md](https://github.com/user-attachments/files/33007111/MaatriLoop-v0.7-README.md)
# MaatriLoop

**Close every care loop.**

MaatriLoop is a non-clinical maternal-care workflow and coordination layer. It keeps operational tasks visible, owned, communicated and moving between doctors, frontline workers and patients.

## v0.7 — Closed-loop voice escalation + infertility pathway

This version extends the Sarvam integration with two important workflow capabilities:

### 1. No response → AI voice follow-up

The communication loop is now:

```text
Approved message
      ↓
Awaiting response
      ↓
No response
      ↓
AI voice follow-up
      ↓
Sarvam TTS speaks approved workflow language
      ↓
Patient responds
      ↓
Sarvam STT
      ↓
Constrained workflow-event extraction
      ↓
Human review task
```

The prototype uses the browser microphone and Sarvam TTS/STT to demonstrate the voice call loop. It is a **voice-call simulation**, not a real PSTN/phone-network integration. A production deployment would connect this workflow state to an approved telephony provider.

AI remains constrained to communication and workflow capture. It does not diagnose, recommend treatment, interpret clinical data or make clinical decisions.

### 2. Infertility / reproductive-endocrinology pathway

The same generic workflow engine can now represent a cycle-based infertility work-up:

- Cycle day logged
- Baseline scan
- Clinic-configured baseline investigations
- Serial follicular monitoring
- HSG / tubal-patency investigation
- HSA / semen analysis tracked in parallel
- Reports received
- Doctor review
- Next workflow step

The exact timing and investigations are deliberately **clinic-configurable** rather than hard-coded as medical advice. The UI demonstrates the operational problem: multiple visits, date-sensitive tasks, partner investigations, reports and handoffs can otherwise become fragmented.

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

The workflow engine is the source of truth. Sarvam is a supporting communication layer.

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

## Synthetic data only

The prototype uses synthetic demo patients. Do not put real patient health information into this repository or into third-party AI APIs until authentication, RBAC, encryption, audit logging, retention/deletion controls, consent/privacy processes and appropriate healthcare data governance are established.

## v0.7 demo sequence

For the hackathon demo, the intended narrative is:

1. Doctor creates/queues an approved patient message.
2. Message enters **Awaiting response**.
3. Click **No response → AI call** to simulate the response window expiring.
4. Sarvam TTS plays the approved voice script.
5. Record a synthetic patient response.
6. Sarvam STT transcribes it.
7. MaatriLoop creates a human-review workflow task.
8. Open **Care pathways** to show that the same engine also handles a cycle-based infertility work-up with multiple scans, HSG, partner investigation, reports and review.
