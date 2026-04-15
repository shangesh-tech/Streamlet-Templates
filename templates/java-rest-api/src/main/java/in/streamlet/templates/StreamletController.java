package in.streamlet.templates;

import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping
public class StreamletController {
  private final RestTemplate restTemplate = new RestTemplate();

  @Value("${streamlet.api.base-url}")
  private String baseUrl;

  @Value("${streamlet.api.key}")
  private String apiKey;

  @Value("${streamlet.account.number}")
  private String accountNumber;

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("success", true, "status", "ok");
  }

  @PostMapping(path = "/api/videos/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> uploadVideo(
      @RequestPart("video") MultipartFile video,
      @RequestParam(value = "videoTitle", required = false) String videoTitle,
      @RequestParam Map<String, String> params) throws IOException {

    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("video", asResource(video));
    body.add("videoTitle", videoTitle != null && !videoTitle.isBlank() ? videoTitle : video.getOriginalFilename());

    for (String key : new String[]{
        "saveOriginalFile",
        "autoAudioEnhancement",
        "enableCaption",
        "engCaption",
        "hindiCaption",
        "tamilCaption",
        "teluguCaption",
        "kannadaCaption",
        "malayalamCaption",
        "enable4kOutput"
    }) {
      if (params.containsKey(key)) {
        body.add(key, params.get(key));
      }
    }

    HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, authHeaders());
    return restTemplate.exchange(baseUrl + "/api-key/start-video-processing", HttpMethod.POST, entity, String.class);
  }

  @GetMapping("/api/videos/{videoId}/status")
  public ResponseEntity<String> videoStatus(@PathVariable String videoId) {
    HttpEntity<Void> entity = new HttpEntity<>(authHeaders());
    return restTemplate.exchange(baseUrl + "/api-key/video-processing-status/" + videoId, HttpMethod.GET, entity, String.class);
  }

  @PostMapping(path = "/api/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> uploadImage(@RequestPart("image") MultipartFile image) throws IOException {
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("image", asResource(image));

    HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, authHeaders());
    return restTemplate.exchange(baseUrl + "/api-key/upload-image", HttpMethod.POST, entity, String.class);
  }

  private HttpHeaders authHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    headers.set("x-streamlet-api-key", apiKey);
    headers.set("x-streamlet-account-number", accountNumber);
    return headers;
  }

  private ByteArrayResource asResource(MultipartFile file) throws IOException {
    return new ByteArrayResource(file.getBytes()) {
      @Override
      public String getFilename() {
        return file.getOriginalFilename();
      }
    };
  }
}
