[README.md](https://github.com/user-attachments/files/32999097/README.md)

# MaatriLoop

A non-clinical workflow coordination prototype for maternal and newborn care.

## Current build
- Doctor / frontline / patient / admin role switcher
- Care timeline ("care clock")
- Operational task queue
- Patient journey view
- Communication loop with WhatsApp + IVR/Voice placeholders
- Sarvam voice-capture interaction mock
- Synthetic demo data only
- Explicit assistive/non-diagnostic guardrail

## Run locally

```bash
npm install
npm run dev
```

## Safety boundary

MaatriLoop does not diagnose, recommend treatment, score clinical risk, interpret medical data, or make autonomous clinical decisions.

The workflow engine remains the source of truth. AI is used only as an assistive language/voice layer around approved workflow information.

## Next
1. Extract workflow state into data objects
2. Add backend API
3. Add database/schema + synthetic seed data
4. Add Sarvam STT/TTS/translation behind backend
5. Add simulated WhatsApp/IVR event loop
6. Add escalation state machine
7. Build demo script + 6–8 slide pitch deck
