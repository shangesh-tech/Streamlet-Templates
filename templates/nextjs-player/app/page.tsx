"use client";

import { useState } from "react";
import { StreamletPlayer } from "@streamlet/sdk/react";

export default function Page() {
  const [streamUrl, setStreamUrl] = useState(process.env.NEXT_PUBLIC_STREAMLET_STREAM_URL || "");
  const [posterUrl, setPosterUrl] = useState(process.env.NEXT_PUBLIC_STREAMLET_POSTER_URL || "");
  const [title, setTitle] = useState(process.env.NEXT_PUBLIC_STREAMLET_VIDEO_TITLE || "Streamlet Demo");
  const [chapterJsonUrl, setChapterJsonUrl] = useState("");
  const [chapterTrackUrl, setChapterTrackUrl] = useState("");
  const [captionsInput, setCaptionsInput] = useState("english,hindi");

  const captionLanguages = captionsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Streamlet Template</p>
        <h1>Next.js Player Starter</h1>
        <p className="lead">
          Drop in a Streamlet playback URL and render a polished player experience with metadata, chapters, and captions.
        </p>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="section-header">
            <h2>Player config</h2>
            <p>Paste your playback data and adjust the UI.</p>
          </div>

          <div className="field-grid">
            <label className="field field-wide">
              <span>Stream URL</span>
              <input value={streamUrl} onChange={(event) => setStreamUrl(event.target.value)} placeholder="https://cdn.streamlet.in/.../master.m3u8" />
            </label>

            <label className="field field-wide">
              <span>Poster URL</span>
              <input value={posterUrl} onChange={(event) => setPosterUrl(event.target.value)} placeholder="https://cdn.streamlet.in/.../thumbnail.jpg" />
            </label>

            <label className="field">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Launch demo" />
            </label>

            <label className="field">
              <span>Caption languages</span>
              <input value={captionsInput} onChange={(event) => setCaptionsInput(event.target.value)} placeholder="english,hindi" />
            </label>

            <label className="field">
              <span>Chapter JSON URL</span>
              <input value={chapterJsonUrl} onChange={(event) => setChapterJsonUrl(event.target.value)} placeholder="Optional" />
            </label>

            <label className="field field-wide">
              <span>Chapter track URL</span>
              <input value={chapterTrackUrl} onChange={(event) => setChapterTrackUrl(event.target.value)} placeholder="Optional .vtt URL" />
            </label>
          </div>
        </article>

        <article className="panel">
          <div className="section-header">
            <h2>Embed preview</h2>
            <p>Use the same component inside your app shell or dashboard.</p>
          </div>

          {streamUrl ? (
            <div className="player-frame">
              <StreamletPlayer
                title={title}
                streamUrl={streamUrl}
                posterUrl={posterUrl || undefined}
                captionLanguages={captionLanguages}
                chaptersUrl={chapterJsonUrl || undefined}
                chapterTrackUrl={chapterTrackUrl || undefined}
                showMeta
                showTimeline
                showChapterSidebar
                theme={{
                  accentColor: "#7c3aed",
                  progressFillColor: "#c084fc",
                }}
              />
            </div>
          ) : (
            <p className="muted">Add a Streamlet `streamUrl` to preview the player.</p>
          )}
        </article>
      </section>
    </main>
  );
}

