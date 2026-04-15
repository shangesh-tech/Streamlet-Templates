import os
from typing import Dict

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Streamlet Python REST API Starter")

STREAMLET_API_BASE_URL = os.getenv("STREAMLET_API_BASE_URL", "https://api.streamlet.in")
STREAMLET_API_KEY = os.getenv("STREAMLET_API_KEY", "")
STREAMLET_ACCOUNT_NUMBER = os.getenv("STREAMLET_ACCOUNT_NUMBER", "")


def auth_headers() -> Dict[str, str]:
    if not STREAMLET_API_KEY or not STREAMLET_ACCOUNT_NUMBER:
        raise HTTPException(status_code=500, detail="Missing STREAMLET_API_KEY or STREAMLET_ACCOUNT_NUMBER")
    return {
        "x-streamlet-api-key": STREAMLET_API_KEY,
        "x-streamlet-account-number": STREAMLET_ACCOUNT_NUMBER,
    }


@app.get("/health")
def health() -> Dict[str, object]:
    return {"success": True, "status": "ok"}


@app.post("/api/videos/upload")
async def upload_video(
    video: UploadFile = File(...),
    videoTitle: str | None = Form(default=None),
    saveOriginalFile: str | None = Form(default=None),
    autoAudioEnhancement: str | None = Form(default=None),
    enableCaption: str | None = Form(default=None),
    engCaption: str | None = Form(default=None),
    hindiCaption: str | None = Form(default=None),
    tamilCaption: str | None = Form(default=None),
    teluguCaption: str | None = Form(default=None),
    kannadaCaption: str | None = Form(default=None),
    malayalamCaption: str | None = Form(default=None),
    enable4kOutput: str | None = Form(default=None),
):
    files = {
        "video": (video.filename, await video.read(), video.content_type or "application/octet-stream"),
    }
    data = {
        "videoTitle": videoTitle or video.filename,
    }

    for key, value in {
        "saveOriginalFile": saveOriginalFile,
        "autoAudioEnhancement": autoAudioEnhancement,
        "enableCaption": enableCaption,
        "engCaption": engCaption,
        "hindiCaption": hindiCaption,
        "tamilCaption": tamilCaption,
        "teluguCaption": teluguCaption,
        "kannadaCaption": kannadaCaption,
        "malayalamCaption": malayalamCaption,
        "enable4kOutput": enable4kOutput,
    }.items():
        if value is not None:
            data[key] = value

    response = requests.post(
        f"{STREAMLET_API_BASE_URL}/api-key/start-video-processing",
        headers=auth_headers(),
        files=files,
        data=data,
        timeout=120,
    )
    return JSONResponse(status_code=response.status_code, content=response.json())


@app.get("/api/videos/{video_id}/status")
def get_video_status(video_id: str):
    response = requests.get(
        f"{STREAMLET_API_BASE_URL}/api-key/video-processing-status/{video_id}",
        headers=auth_headers(),
        timeout=30,
    )
    return JSONResponse(status_code=response.status_code, content=response.json())


@app.post("/api/images/upload")
async def upload_image(image: UploadFile = File(...)):
    files = {
        "image": (image.filename, await image.read(), image.content_type or "application/octet-stream"),
    }
    response = requests.post(
        f"{STREAMLET_API_BASE_URL}/api-key/upload-image",
        headers=auth_headers(),
        files=files,
        timeout=120,
    )
    return JSONResponse(status_code=response.status_code, content=response.json())

