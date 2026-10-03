[Uploading README.md…]()
# MaatriLoop

**Close every care loop.**

MaatriLoop is a non-clinical maternal-care workflow and coordination prototype. It keeps operational work visible across doctors, frontline workers and patients, while using AI only for communication and workflow capture.

## What this version demonstrates

- Doctor / Frontline / Patient / Admin role workspaces
- Appointment creation
- Appointment confirmation
- Missed appointment → frontline escalation → outcome → reschedule task
- Care timeline / task state visibility
- Multilingual communication preview
- Sarvam voice workflow architecture in demo mode
- Human-review gate for AI-generated structured workflow events
- Admin workflow health and audit trail
- Privacy / data-governance checklist
- Synthetic demo data only

## Important

This is **not production-ready healthcare software**.

The browser demo intentionally does not contain:
- diagnosis
- treatment recommendations
- clinical decision support
- clinical risk scoring
- interpretation of medical data
- autonomous clinical advice

The workflow engine is the source of truth. The AI layer is a supporting service.

## Frontend

```bash
npm install
npm run dev
```

For GitHub Pages, keep Vite's repository base path:

```js
base: "/maatriloop/"
```

## Sarvam architecture

Do not expose a Sarvam API key in React/Vite.

Production flow:

```text
Frontend
   ↓
Backend / AI Gateway
   ↓
Sarvam STT / Translation / TTS
   ↓
Structured workflow event or approved communication
   ↓
Human review / workflow engine
   ↓
Database
```

For the hackathon prototype, the UI uses a deterministic demo adapter so the product remains runnable on GitHub Pages without exposing credentials.

## Production data protection checklist

Before real patient data:
1. Authentication
2. Server-side RBAC
3. Server-side secrets
4. TLS + encryption at rest
5. Audit logs
6. Data minimisation
7. Retention/deletion policy
8. Vendor/data-processing review
9. Consent and privacy notices where required
10. Clinical pathway governance by the participating clinical team

Use synthetic data in the public GitHub demo.
