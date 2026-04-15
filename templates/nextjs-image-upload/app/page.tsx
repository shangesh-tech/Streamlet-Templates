"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { StreamletClient } from "@streamlet/sdk";

type ImageResult = {
  imageId?: string;
  cdnUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
};

export default function Page() {
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_STREAMLET_API_URL || "https://api.streamlet.in");
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_STREAMLET_API_KEY || "");
  const [accountNumber, setAccountNumber] = useState(process.env.NEXT_PUBLIC_STREAMLET_ACCOUNT_NUMBER || "");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("Choose an image file first.");
      return;
    }

    if (!baseUrl || !apiKey || !accountNumber) {
      setError("Base URL, API key, and account number are required.");
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);

    try {
      const client = new StreamletClient({ baseUrl, apiKey, accountNumber });
      const nextResult = await client.uploadImage({ file });
      setResult(nextResult);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Streamlet Template</p>
        <h1>Next.js Image Upload Starter</h1>
        <p className="lead">
          Upload images with <code>@streamlet/sdk</code> and use the hosted CDN URL directly in your app.
        </p>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>Connection</h2>
          <p>Use your Streamlet image-hosting credentials.</p>
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
          <h2>Upload image</h2>
          <p>Streamlet stores the uploaded asset and returns a CDN URL.</p>
        </div>

        <div className="upload-box">
          <div className="file-row">
            <button className="secondary-button" onClick={() => inputRef.current?.click()} type="button">
              {file ? "Choose another image" : "Choose image"}
            </button>
            <span className="muted">
              {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : "PNG, JPG, WEBP, AVIF, GIF"}
            </span>
            <input
              ref={inputRef}
              hidden
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>
          <button className="primary-button" disabled={isUploading} onClick={handleUpload} type="button">
            {isUploading ? "Uploading..." : "Upload image"}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="section-header">
            <h2>Upload response</h2>
            <p>Inspect the returned Streamlet metadata.</p>
          </div>
          <pre className="code-block">{JSON.stringify(result, null, 2) || "{\n  \"imageId\": null\n}"}</pre>
        </article>

        <article className="panel">
          <div className="section-header">
            <h2>Preview</h2>
            <p>Render the hosted image URL directly.</p>
          </div>
          {result?.cdnUrl ? (
            <div className="preview-card">
              <img alt="Uploaded asset preview" className="preview-image" src={result.cdnUrl} />
              <a className="preview-link" href={result.cdnUrl} rel="noreferrer" target="_blank">
                Open CDN URL
              </a>
            </div>
          ) : (
            <p className="muted">Upload an image to see the CDN preview.</p>
          )}
        </article>
      </section>
    </main>
  );
}
