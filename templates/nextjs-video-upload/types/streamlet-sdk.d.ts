declare module "@streamlet/sdk" {
  export class StreamletClient {
    constructor(config: {
      baseUrl: string;
      apiKey: string;
      accountNumber: string;
    });

    uploadVideo(input: {
      file: File | Blob;
      videoTitle?: string;
      enableCaption?: boolean;
      captionLanguages?: string[];
      enable4kOutput?: boolean;
      saveOriginalFile?: boolean;
      autoAudioEnhancement?: boolean;
    }): Promise<{ videoId: string }>;

    pollVideoStatus(
      videoId: string,
      options?: {
        interval?: number;
        timeout?: number;
        onProgress?: (status: Record<string, unknown>) => void;
      },
    ): Promise<Record<string, unknown>>;
  }
}

