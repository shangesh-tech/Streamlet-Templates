import "dotenv/config";
import express from "express";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 8080);

const streamletBaseUrl = process.env.STREAMLET_API_BASE_URL || "https://api.streamlet.in";
const streamletApiKey = process.env.STREAMLET_API_KEY || "";
const streamletAccountNumber = process.env.STREAMLET_ACCOUNT_NUMBER || "";

app.use(express.json());

function getAuthHeaders() {
  return {
    "x-streamlet-api-key": streamletApiKey,
    "x-streamlet-account-number": streamletAccountNumber,
  };
}

function ensureConfig(res) {
  if (streamletApiKey && streamletAccountNumber) {
    return true;
  }

  res.status(500).json({
    success: false,
    error: "Missing STREAMLET_API_KEY or STREAMLET_ACCOUNT_NUMBER",
  });
  return false;
}

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
  if (!ensureConfig(res)) return;
  if (!req.file) {
    res.status(400).json({ success: false, error: "video file is required" });
    return;
  }

  const formData = new FormData();
  const mimeType = req.file.mimetype || "application/octet-stream";
  formData.append("video", new Blob([req.file.buffer], { type: mimeType }), req.file.originalname);
  formData.append("videoTitle", req.body.videoTitle || req.file.originalname);

  for (const field of [
    "saveOriginalFile",
    "autoAudioEnhancement",
    "enableCaption",
    "engCaption",
    "hindiCaption",
    "tamilCaption",
    "teluguCaption",
    "kannadaCaption",
    "malayalamCaption",
    "enable4kOutput",
  ]) {
    if (typeof req.body[field] === "string") {
      formData.append(field, req.body[field]);
    }
  }

  try {
    const response = await fetch(`${streamletBaseUrl}/api-key/start-video-processing`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await response.json().catch(() => null);
    res.status(response.status).json(data || { success: false, error: "Invalid Streamlet response" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Video upload failed",
    });
  }
});

app.get("/api/videos/:videoId/status", async (req, res) => {
  if (!ensureConfig(res)) return;

  try {
    const response = await fetch(`${streamletBaseUrl}/api-key/video-processing-status/${encodeURIComponent(req.params.videoId)}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => null);
    res.status(response.status).json(data || { success: false, error: "Invalid Streamlet response" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Status request failed",
    });
  }
});

app.post("/api/images/upload", upload.single("image"), async (req, res) => {
  if (!ensureConfig(res)) return;
  if (!req.file) {
    res.status(400).json({ success: false, error: "image file is required" });
    return;
  }

  const formData = new FormData();
  const mimeType = req.file.mimetype || "application/octet-stream";
  formData.append("image", new Blob([req.file.buffer], { type: mimeType }), req.file.originalname);

  try {
    const response = await fetch(`${streamletBaseUrl}/api-key/upload-image`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await response.json().catch(() => null);
    res.status(response.status).json(data || { success: false, error: "Invalid Streamlet response" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Image upload failed",
    });
  }
});

app.listen(port, () => {
  console.log(`Streamlet Express starter listening on http://localhost:${port}`);
});

