import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

// MaatriLoop v0.7 — Sarvam gateway
// API keys stay on the server. The browser never receives SARVAM_API_KEY.
// Synthetic/demo data only.
//
// v0.7 additions:
// - Robust CORS + request logging
// - Sarvam speech-to-text
// - Sarvam translation
// - Sarvam text-to-speech
// - Patient AI voice-call workflow
// - Constrained patient-response extraction
// - Workflow escalation support

dotenv.config();

const app = express();

const upload = multer({
  dest: "tmp/",
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});

const PORT = process.env.PORT || 8787;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

const configuredOrigins = (
  process.env.FRONTEND_ORIGIN || "https://gaurit7.github.io"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

/* ---------------------------------------------------------
   REQUEST LOGGING
--------------------------------------------------------- */

app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path} origin=${
      req.headers.origin || "-"
    }`
  );

  next();
});

/* ---------------------------------------------------------
   CORS
--------------------------------------------------------- */

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server requests may not have an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${normalizedOrigin}`)
      );
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],

    credentials: false,

    optionsSuccessStatus: 204
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

const SARVAM_BASE = "https://api.sarvam.ai";

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function requireKey(res) {
  if (!SARVAM_API_KEY) {
    res.status(503).json({
      error: "Sarvam gateway is not configured.",
      code: "SARVAM_API_KEY_MISSING"
    });

    return false;
  }

  return true;
}

function mapLanguage(language) {
  return (
    {
      English: "en-IN",
      Hindi: "hi-IN",
      Marathi: "mr-IN"
    }[language] ||
    language ||
    "en-IN"
  );
}

/* ---------------------------------------------------------
   WORKFLOW REASON EXTRACTION
--------------------------------------------------------- */

function safeReason(transcript = "") {
  const text = transcript.toLowerCase();

  if (
    /transport|bus|vehicle|travel|ride|गाड़ी|वाहन|प्रवास|वाहतूक/.test(
      text
    )
  ) {
    return "TRANSPORT";
  }

  if (
    /schedule|scheduling|time|timing|काम|वेळ|समय|समय नहीं|conflict/.test(
      text
    )
  ) {
    return "SCHEDULING_CONFLICT";
  }

  if (
    /could not reach|no answer|didn't answer|not reachable|फोन नहीं|संपर्क|call/.test(
      text
    )
  ) {
    return "COULD_NOT_REACH";
  }

  return "OTHER";
}

/* ---------------------------------------------------------
   WORKFLOW EVENT EXTRACTION
--------------------------------------------------------- */

function extractWorkflowEvent(
  transcript = "",
  context = "WORKFLOW_UPDATE"
) {
  const text = transcript.toLowerCase();

  const missed =
    /miss|missed|no.?show|appointment.*not|भेट.*चुक|अपॉइंटमेंट.*मिस|अपॉइंटमेंट.*नहीं|नहीं.*आया|नाही.*आला/.test(
      text
    );

  const patientNames = [
    "Asha Kulkarni",
    "Meena Patil",
    "Pooja Shaikh"
  ];

  const patient =
    patientNames.find((name) => {
      const [first, last] = name.toLowerCase().split(" ");

      return (
        text.includes(first) ||
        text.includes(last)
      );
    }) || null;

  /* -------------------------------------------------------
     PATIENT VOICE CALL
  ------------------------------------------------------- */

  if (context === "PATIENT_VOICE_CALL") {
    const reschedule =
      /reschedule|new appointment|another slot|change.*appointment|पुन्हा.*भेट|नवी.*अपॉइंटमेंट|फिर से.*अपॉइंटमेंट|समय बदल|वेळ बदल/.test(
        text
      );

    const confirm =
      /yes|okay|ok|sure|confirm|हो|होय|ठीक|हाँ|हां|yes please/.test(
        text
      );

    const decline =
      /no|not now|नको|नाही|नहीं|no thanks/.test(
        text
      );

    return {
      event: "PATIENT_RESPONSE",

      intent: reschedule
        ? "RESCHEDULE_REQUEST"
        : confirm
        ? "CONFIRMED"
        : decline
        ? "DECLINED"
        : "OTHER",

      reason: safeReason(transcript),

      patient,

      requires_followup: true
    };
  }

  /* -------------------------------------------------------
     MISSED APPOINTMENT
  ------------------------------------------------------- */

  if (missed) {
    return {
      event: "MISSED_APPOINTMENT",

      reason: safeReason(transcript),

      patient,

      requires_followup: true
    };
  }

  /* -------------------------------------------------------
     GENERIC WORKFLOW UPDATE
  ------------------------------------------------------- */

  return {
    event: "WORKFLOW_UPDATE",

    reason: "OTHER",

    patient,

    requires_followup: false
  };
}

/* ---------------------------------------------------------
   HEALTH CHECK
--------------------------------------------------------- */

app.get("/health", (_req, res) => {
  res.json({
    ok: true,

    service: "maatriloop-gateway",

    sarvamConfigured: Boolean(
      SARVAM_API_KEY
    ),

    syntheticDataOnly: true,

    voiceCallDemo: true
  });
});

/* =========================================================
   SARVAM SPEECH → TEXT
========================================================= */

app.post(
  "/api/voice/transcribe",
  upload.single("audio"),
  async (req, res) => {
    let filePath;

    try {
      if (!requireKey(res)) {
        return;
      }

      if (!req.file) {
        return res.status(400).json({
          error: "audio required"
        });
      }

      filePath = req.file.path;

      const language =
        req.body?.language || "";

      const mode =
        req.body?.mode || "codemix";

      const context =
        req.body?.context ||
        "WORKFLOW_UPDATE";

      const audio =
        await fs.promises.readFile(
          filePath
        );

      const form = new FormData();

      const blob = new Blob(
        [audio],
        {
          type:
            req.file.mimetype ||
            "audio/webm"
        }
      );

      form.append(
        "file",
        blob,
        req.file.originalname ||
          "voice.webm"
      );

      form.append(
        "model",
        "saaras:v4"
      );

      form.append(
        "mode",
        mode
      );

      if (language) {
        form.append(
          "language_code",
          mapLanguage(language)
        );
      }

      form.append(
        "with_timestamps",
        "false"
      );

      form.append(
        "num_speakers",
        "1"
      );

      form.append(
        "keyterms",
        JSON.stringify([
          "MaatriLoop",
          "Asha",
          "Meena",
          "Pooja",
          "appointment",
          "ANC",
          "frontline",
          "transport",
          "reschedule"
        ])
      );

      const response = await fetch(
        `${SARVAM_BASE}/speech-to-text`,
        {
          method: "POST",

          headers: {
            "api-subscription-key":
              SARVAM_API_KEY
          },

          body: form
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          error:
            payload?.error ||
            payload?.message ||
            "Sarvam STT request failed",

          provider: "Sarvam",

          details: payload
        });
      }

      const transcript =
        payload.transcript || "";

      res.json({
        provider: "Sarvam",

        model: "saaras:v4",

        transcript,

        languageCode:
          payload.language_code ||
          null,

        requestId:
          payload.request_id ||
          null,

        workflowEvent:
          extractWorkflowEvent(
            transcript,
            context
          )
      });
    } catch (error) {
      console.error(
        "STT error",
        error
      );

      res.status(500).json({
        error:
          "Speech transcription failed",

        details:
          error.message
      });
    } finally {
      if (filePath) {
        try {
          await fs.promises.unlink(
            filePath
          );
        } catch {}
      }
    }
  }
);

/* =========================================================
   SARVAM TRANSLATION
========================================================= */

app.post(
  "/api/communication/translate",
  async (req, res) => {
    try {
      if (!requireKey(res)) {
        return;
      }

      const {
        text,
        targetLanguage,
        sourceLanguage = "English"
      } = req.body || {};

      if (
        !text ||
        !targetLanguage
      ) {
        return res.status(400).json({
          error:
            "text and targetLanguage required"
        });
      }

      const response = await fetch(
        `${SARVAM_BASE}/translate`,
        {
          method: "POST",

          headers: {
            "api-subscription-key":
              SARVAM_API_KEY,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            input: text,

            source_language_code:
              mapLanguage(
                sourceLanguage
              ),

            target_language_code:
              mapLanguage(
                targetLanguage
              ),

            model:
              "sarvam-translate:v1"
          })
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          error:
            payload?.error ||
            payload?.message ||
            "Sarvam translation failed",

          provider: "Sarvam",

          details: payload
        });
      }

      res.json({
        provider: "Sarvam",

        model:
          "sarvam-translate:v1",

        translatedText:
          payload.translated_text ||
          "",

        requestId:
          payload.request_id ||
          null,

        sourceLanguage:
          payload.source_language_code ||
          mapLanguage(
            sourceLanguage
          )
      });
    } catch (error) {
      console.error(
        "Translation error",
        error
      );

      res.status(500).json({
        error:
          "Translation failed",

        details:
          error.message
      });
    }
  }
);

/* =========================================================
   SARVAM TEXT → SPEECH
========================================================= */

app.post(
  "/api/voice/speak",
  async (req, res) => {
    try {
      if (!requireKey(res)) {
        return;
      }

      const {
        text,

        language = "English",

        speaker = "shubh",

        pace = 1
      } = req.body || {};

      if (!text) {
        return res.status(400).json({
          error: "text required"
        });
      }

      const response = await fetch(
        `${SARVAM_BASE}/text-to-speech`,
        {
          method: "POST",

          headers: {
            "api-subscription-key":
              SARVAM_API_KEY,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            text,

            model:
              "bulbul:v3",

            language_code:
              mapLanguage(language),

            speaker,

            pace,

            output_audio_codec:
              "wav",

            speech_sample_rate:
              24000
          })
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          error:
            payload?.error ||
            payload?.message ||
            "Sarvam TTS failed",

          provider: "Sarvam",

          details: payload
        });
      }

      res.json({
        provider: "Sarvam",

        model: "bulbul:v3",

        audioBase64:
          payload.audios?.[0] ||
          null,

        requestId:
          payload.request_id ||
          null,

        languageCode:
          mapLanguage(language)
      });
    } catch (error) {
      console.error(
        "TTS error",
        error
      );

      res.status(500).json({
        error:
          "Text-to-speech failed",

        details:
          error.message
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(
    `MaatriLoop Sarvam gateway listening on ${PORT}`
  );
});
