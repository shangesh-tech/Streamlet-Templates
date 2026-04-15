"use client";

import { useRef, useState } from "react";
import { StreamletClient } from "@streamlet/sdk";

const CAPTION_LANGUAGES = ["english", "hindi", "tamil", "telugu", "kannada", "malayalam"] as const;

type CaptionLanguage = (typeof CAPTION_LANGUAGES)[number];

type VideoStatus = {
  status?: string;
  videoId?: string;
  videoTitle?: string;
  streamUrl?: string;
  thumbnail?: string;
  captions?: Record<string, string>;
  error?: string;
};

type LogLine = {
  message: string;
  tone: "info" | "success" | "error";
};

export default function Page() {
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_STREAMLET_API_URL || "https://api.streamlet.in");
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_STREAMLET_API_KEY || "");
  const [accountNumber, setAccountNumber] = useState(process.env.NEXT_PUBLIC_STREAMLET_ACCOUNT_NUMBER || "");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [enableCaption, setEnableCaption] = useState(false);
  const [enable4k, setEnable4k] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<CaptionLanguage[]>(["english"]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pushLog(message: string, tone: LogLine["tone"] = "info") {
    setLogs((current) => [...current, { message, tone }]);
  }

  function toggleLanguage(language: CaptionLanguage) {
    setSelectedLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  }

  async function handleSubmit() {
    if (!file) {
      pushLog("Choose a video file before starting.", "error");
      return;
    }

    if (!baseUrl || !apiKey || !accountNumber) {
      pushLog("Base URL, API key, and account number are required.", "error");
      return;
    }

    setIsSubmitting(true);
    setLogs([]);
    setStatus(null);

    try {
      const client = new StreamletClient({ baseUrl, apiKey, accountNumber });
      pushLog("Uploading video to Streamlet...");

      const uploadResult = await client.uploadVideo({
        file,
        videoTitle: title.trim() || file.name,
        enableCaption,
        captionLanguages: enableCaption ? selectedLanguages : [],
        enable4kOutput: enable4k,
        saveOriginalFile: false,
        autoAudioEnhancement: true,
      });

      pushLog(`Upload queued. videoId: ${uploadResult.videoId}`, "success");
      pushLog("Polling for processing status...");

      const finalStatus = (await client.pollVideoStatus(uploadResult.videoId, {
        interval: 4000,
        timeout: 600000,
        onProgress: (nextStatus: VideoStatus) => {
          setStatus(nextStatus);
          pushLog(`Current status: ${nextStatus.status || "unknown"}`);
        },
      })) as VideoStatus;

      setStatus(finalStatus);

      if (finalStatus.status === "completed") {
        pushLog("Video processing completed.", "success");
      } else {
        const errorMessage = typeof finalStatus.error === "string" && finalStatus.error
          ? finalStatus.error
          : "Video processing failed.";
        pushLog(errorMessage, "error");
      }
    } catch (error) {
      pushLog(error instanceof Error ? error.message : "Upload failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Streamlet Template</p>
        <h1>Next.js Video Upload Starter</h1>
        <p className="lead">
          Upload a video with <code>@streamlet/sdk</code>, queue processing, and wait for the final playback URLs.
        </p>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>Connection</h2>
          <p>Use your Streamlet API credentials.</p>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Base URL</span>
            <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.streamlet.in" />
          </label>
          <label className="field">
            <span>API Key</span>
            <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk_streamlet_live_xxx" type="password" />
          </label>
          <label className="field">
            <span>Account Number</span>
            <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="your_account_id" />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>Upload</h2>
          <p>Queue a video and let Streamlet handle processing.</p>
        </div>

        <div className="field-grid">
          <label className="field field-wide">
            <span>Video title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Product demo" />
          </label>

          <div className="field field-wide">
            <span>Video file</span>
            <div className="file-row">
              <button className="secondary-button" onClick={() => fileInputRef.current?.click()} type="button">
                {file ? "Choose another file" : "Choose video"}
              </button>
              <p className="file-label">{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "No file selected"}</p>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="video/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        <div className="toggle-row">
          <label className="checkbox">
            <input checked={enableCaption} onChange={(event) => setEnableCaption(event.target.checked)} type="checkbox" />
            <span>Enable captions</span>
          </label>
          <label className="checkbox">
            <input checked={enable4k} onChange={(event) => setEnable4k(event.target.checked)} type="checkbox" />
            <span>Enable 4K output</span>
          </label>
        </div>

        {enableCaption && (
          <div className="chip-row">
            {CAPTION_LANGUAGES.map((language) => (
              <button
                key={language}
                className={selectedLanguages.includes(language) ? "chip chip-active" : "chip"}
                onClick={() => toggleLanguage(language)}
                type="button"
              >
                {language}
              </button>
            ))}
          </div>
        )}

        <div className="actions">
          <button className="primary-button" disabled={isSubmitting} onClick={handleSubmit} type="button">
            {isSubmitting ? "Processing..." : "Upload and process"}
          </button>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="section-header">
            <h2>Live logs</h2>
            <p>Track upload and processing progress.</p>
          </div>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="muted">No activity yet.</p>
            ) : (
              logs.map((entry, index) => (
                <p
                  key={`${entry.message}-${index}`}
                  className={entry.tone === "error" ? "log-error" : entry.tone === "success" ? "log-success" : "muted"}
                >
                  {entry.message}
                </p>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="section-header">
            <h2>Final status</h2>
            <p>Processing response from Streamlet.</p>
          </div>
          <pre className="code-block">{JSON.stringify(status, null, 2) || "{\n  \"status\": \"idle\"\n}"}</pre>
        </article>
      </section>
    </main>
  );
}
