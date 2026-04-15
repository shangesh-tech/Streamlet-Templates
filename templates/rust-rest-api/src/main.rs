use axum::{
    extract::{Multipart, Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use dotenvy::dotenv;
use reqwest::multipart::{Form, Part};
use serde::Serialize;
use serde_json::Value;
use std::{env, net::SocketAddr, sync::Arc};

#[derive(Clone)]
struct AppState {
    api_base_url: String,
    api_key: String,
    account_number: String,
    client: reqwest::Client,
}

#[derive(Serialize)]
struct BasicResponse<'a> {
    success: bool,
    status: &'a str,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let state = Arc::new(AppState {
        api_base_url: env::var("STREAMLET_API_BASE_URL")
            .unwrap_or_else(|_| "https://api.streamlet.in".to_string()),
        api_key: env::var("STREAMLET_API_KEY").unwrap_or_default(),
        account_number: env::var("STREAMLET_ACCOUNT_NUMBER").unwrap_or_default(),
        client: reqwest::Client::new(),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/videos/upload", post(upload_video))
        .route("/api/videos/:video_id/status", get(video_status))
        .route("/api/images/upload", post(upload_image))
        .with_state(state);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{port}").parse().expect("invalid address");
    println!("Streamlet Rust starter listening on http://{addr}");
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn health() -> Json<BasicResponse<'static>> {
    Json(BasicResponse {
        success: true,
        status: "ok",
    })
}

async fn upload_video(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    if let Some(error_response) = ensure_config(&state) {
        return error_response;
    }

    let mut form = Form::new();
    let mut video_found = false;
    let mut video_title = None;
    let passthrough_fields = [
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
    ];

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or_default().to_string();

        if name == "video" {
            let file_name = field
                .file_name()
                .map(|value| value.to_string())
                .unwrap_or_else(|| "upload.bin".to_string());
            let content_type = field
                .content_type()
                .map(|value| value.to_string())
                .unwrap_or_else(|| "application/octet-stream".to_string());
            let bytes = field.bytes().await.unwrap_or_default();
            let part = Part::bytes(bytes.to_vec())
                .file_name(file_name)
                .mime_str(&content_type)
                .unwrap();
            form = form.part("video", part);
            video_found = true;
        } else {
            let value = field.text().await.unwrap_or_default();
            if name == "videoTitle" {
                video_title = Some(value.clone());
            }
            if passthrough_fields.contains(&name.as_str()) {
                form = form.text(name, value);
            }
        }
    }

    if !video_found {
        return json_response(
            StatusCode::BAD_REQUEST,
            serde_json::json!({ "success": false, "error": "video file is required" }),
        );
    }

    form = form.text("videoTitle", video_title.unwrap_or_else(|| "Untitled video".to_string()));

    proxy_request(
        &state,
        reqwest::Method::POST,
        format!("{}/api-key/start-video-processing", state.api_base_url),
        Some(form),
    )
    .await
}

async fn video_status(
    State(state): State<Arc<AppState>>,
    Path(video_id): Path<String>,
) -> impl IntoResponse {
    if let Some(error_response) = ensure_config(&state) {
        return error_response;
    }

    proxy_request(
        &state,
        reqwest::Method::GET,
        format!(
            "{}/api-key/video-processing-status/{}",
            state.api_base_url, video_id
        ),
        None,
    )
    .await
}

async fn upload_image(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    if let Some(error_response) = ensure_config(&state) {
        return error_response;
    }

    let mut form = Form::new();
    let mut image_found = false;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        if field.name().unwrap_or_default() == "image" {
            let file_name = field
                .file_name()
                .map(|value| value.to_string())
                .unwrap_or_else(|| "upload.bin".to_string());
            let content_type = field
                .content_type()
                .map(|value| value.to_string())
                .unwrap_or_else(|| "application/octet-stream".to_string());
            let bytes = field.bytes().await.unwrap_or_default();
            let part = Part::bytes(bytes.to_vec())
                .file_name(file_name)
                .mime_str(&content_type)
                .unwrap();
            form = form.part("image", part);
            image_found = true;
        }
    }

    if !image_found {
        return json_response(
            StatusCode::BAD_REQUEST,
            serde_json::json!({ "success": false, "error": "image file is required" }),
        );
    }

    proxy_request(
        &state,
        reqwest::Method::POST,
        format!("{}/api-key/upload-image", state.api_base_url),
        Some(form),
    )
    .await
}

fn ensure_config(state: &AppState) -> Option<(StatusCode, HeaderMap, Json<Value>)> {
    if state.api_key.is_empty() || state.account_number.is_empty() {
        Some(json_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            serde_json::json!({ "success": false, "error": "Missing STREAMLET_API_KEY or STREAMLET_ACCOUNT_NUMBER" }),
        ))
    } else {
        None
    }
}

async fn proxy_request(
    state: &AppState,
    method: reqwest::Method,
    url: String,
    form: Option<Form>,
) -> impl IntoResponse {
    let mut request = state
        .client
        .request(method, url)
        .header("x-streamlet-api-key", &state.api_key)
        .header("x-streamlet-account-number", &state.account_number);

    if let Some(payload) = form {
        request = request.multipart(payload);
    }

    match request.send().await {
        Ok(response) => {
            let status = response.status();
            let body = response
                .json::<Value>()
                .await
                .unwrap_or_else(|_| serde_json::json!({ "success": false, "error": "Invalid Streamlet response" }));
            json_response(StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::BAD_GATEWAY), body)
        }
        Err(error) => json_response(
            StatusCode::BAD_GATEWAY,
            serde_json::json!({ "success": false, "error": error.to_string() }),
        ),
    }
}

fn json_response(status: StatusCode, body: Value) -> (StatusCode, HeaderMap, Json<Value>) {
    let mut headers = HeaderMap::new();
    headers.insert("content-type", "application/json".parse().unwrap());
    (status, headers, Json(body))
}
