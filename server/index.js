import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const upload = multer({ dest: "tmp/" });

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "maatriloop-gateway",
    syntheticDataOnly: true
  });
});

/*
 * These routes are intentionally thin integration boundaries.
 * Add authentication/RBAC/rate limits/audit persistence before production.
 */

app.post("/api/communication/translate", async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text || !targetLanguage) return res.status(400).json({ error: "text and targetLanguage required" });

  // TODO: call Sarvam Translation from this server.
  // Keep SARVAM_API_KEY server-side.
  res.json({
    mode: "demo",
    source: text,
    targetLanguage,
    translatedText: text,
    provider: "Sarvam gateway placeholder"
  });
});

app.post("/api/voice/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio required" });

    // TODO: send the audio to Sarvam STT from the backend.
    // Never send SARVAM_API_KEY from the browser.
    res.json({
      mode: "demo",
      transcript: "Asha's appointment was missed because transport was unavailable.",
      provider: "Sarvam gateway placeholder"
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

app.post("/api/voice/speak", async (req, res) => {
  const { text, language } = req.body || {};
  if (!text || !language) return res.status(400).json({ error: "text and language required" });

  // TODO: call Sarvam TTS from this backend.
  res.json({
    mode: "demo",
    text,
    language,
    provider: "Sarvam gateway placeholder"
  });
});

app.listen(PORT, () => {
  console.log(`MaatriLoop gateway listening on ${PORT}`);
});
