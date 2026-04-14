# Streamlet Templates

Official Streamlet templates for video upload, playback, image hosting, and media workflows.

This repository contains ready-to-use examples for video upload, image hosting, playback, and media workflows using Streamlet APIs and SDKs.

## What Is Streamlet?

Streamlet is media infrastructure for modern apps.

It helps you:

- Upload and process videos
- Stream video with global playback
- Add captions, thumbnails and Chapters
- Upload and host images
- Deliver media through CDN URLs
- Integrate through REST API or `@streamlet/sdk`

## Templates

This repository may include templates such as:

- Next.js video upload starter
- Next.js image hosting starter
- REST API backend example
- `@streamlet/sdk` JavaScript starter
- React player integration example

## Typical Workflow

### Video

1. Upload a video
2. Receive a `videoId`
3. Poll processing status
4. Use the final `streamUrl`, thumbnail, and captions

### Images

1. Upload an image
2. Receive `imageId` and `cdnUrl`
3. Use the CDN URL in your app

## Best For

- SaaS products
- Course platforms
- Creator tools
- Internal media dashboards
- Marketing sites
- Apps with media uploads

## Getting Started

1. Choose a template and clone
2. Install dependencies
3. Add your Streamlet credentials
4. Run locally
5. Customize for your app

## Example Environment Variables

```env
NEXT_PUBLIC_STREAMLET_API_URL=https://api.streamlet.in
STREAMLET_API_KEY=your_api_key
STREAMLET_ACCOUNT_NUMBER=your_account_number
```
---

## Check Out - [Streamlet SDK](https://www.npmjs.com/package/@streamlet/sdk)

---
## Contact - shangesh@streamlet.in
