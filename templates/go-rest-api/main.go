package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type errorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

func main() {
	port := valueOrDefault("PORT", "8080")
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/videos/upload", videoUploadHandler)
	http.HandleFunc("/api/videos/", videoStatusHandler)
	http.HandleFunc("/api/images/upload", imageUploadHandler)

	log.Printf("Streamlet Go starter listening on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "status": "ok"})
}

func videoUploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Success: false, Error: "method not allowed"})
		return
	}

	baseURL, ok := ensureConfig(w)
	if !ok {
		return
	}

	if err := r.ParseMultipartForm(2 << 30); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Success: false, Error: "invalid multipart form"})
		return
	}

	file, header, err := r.FormFile("video")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Success: false, Error: "video file is required"})
		return
	}
	defer file.Close()

	fields := map[string]string{
		"videoTitle": valueOrDefaultFromRequest(r, "videoTitle", header.Filename),
	}

	for _, key := range []string{
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
	} {
		if value := r.FormValue(key); value != "" {
			fields[key] = value
		}
	}

	proxyMultipart(w, file, "video", header.Filename, fields, baseURL+"/api-key/start-video-processing")
}

func videoStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Success: false, Error: "method not allowed"})
		return
	}

	baseURL, ok := ensureConfig(w)
	if !ok {
		return
	}

	prefix := "/api/videos/"
	if !strings.HasPrefix(r.URL.Path, prefix) || !strings.HasSuffix(r.URL.Path, "/status") {
		writeJSON(w, http.StatusNotFound, errorResponse{Success: false, Error: "not found"})
		return
	}

	videoID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, prefix), "/status")
	videoID = strings.Trim(videoID, "/")
	if videoID == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Success: false, Error: "videoId is required"})
		return
	}

	proxyJSONRequest(w, http.MethodGet, fmt.Sprintf("%s/api-key/video-processing-status/%s", baseURL, videoID), nil)
}

func imageUploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Success: false, Error: "method not allowed"})
		return
	}

	baseURL, ok := ensureConfig(w)
	if !ok {
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Success: false, Error: "invalid multipart form"})
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Success: false, Error: "image file is required"})
		return
	}
	defer file.Close()

	proxyMultipart(w, file, "image", header.Filename, nil, baseURL+"/api-key/upload-image")
}

func proxyMultipart(w http.ResponseWriter, file multipart.File, fieldName, fileName string, fields map[string]string, targetURL string) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile(fieldName, filepath.Base(fileName))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to create multipart body"})
		return
	}

	if _, err = io.Copy(part, file); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to copy uploaded file"})
		return
	}

	for key, value := range fields {
		if err = writer.WriteField(key, value); err != nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to add multipart field"})
			return
		}
	}

	if err = writer.Close(); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to finalize multipart body"})
		return
	}

	req, err := http.NewRequest(http.MethodPost, targetURL, &body)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to create Streamlet request"})
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	addAuthHeaders(req)
	forwardResponse(w, req)
}

func proxyJSONRequest(w http.ResponseWriter, method, targetURL string, payload io.Reader) {
	req, err := http.NewRequest(method, targetURL, payload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "failed to create Streamlet request"})
		return
	}

	addAuthHeaders(req)
	forwardResponse(w, req)
}

func forwardResponse(w http.ResponseWriter, req *http.Request) {
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, errorResponse{Success: false, Error: err.Error()})
		return
	}
	defer response.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)
	io.Copy(w, response.Body)
}

func addAuthHeaders(req *http.Request) {
	req.Header.Set("x-streamlet-api-key", os.Getenv("STREAMLET_API_KEY"))
	req.Header.Set("x-streamlet-account-number", os.Getenv("STREAMLET_ACCOUNT_NUMBER"))
}

func ensureConfig(w http.ResponseWriter) (string, bool) {
	baseURL := valueOrDefault("STREAMLET_API_BASE_URL", "https://api.streamlet.in")
	if os.Getenv("STREAMLET_API_KEY") == "" || os.Getenv("STREAMLET_ACCOUNT_NUMBER") == "" {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Success: false, Error: "Missing STREAMLET_API_KEY or STREAMLET_ACCOUNT_NUMBER"})
		return "", false
	}
	return baseURL, true
}

func valueOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func valueOrDefaultFromRequest(r *http.Request, key, fallback string) string {
	value := strings.TrimSpace(r.FormValue(key))
	if value == "" {
		return fallback
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

