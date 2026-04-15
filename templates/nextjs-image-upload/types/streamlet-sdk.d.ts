declare module "@streamlet/sdk" {
  export class StreamletClient {
    constructor(config: {
      baseUrl: string;
      apiKey: string;
      accountNumber: string;
    });

    uploadImage(input: {
      file: File | Blob;
    }): Promise<{
      imageId: string;
      cdnUrl: string;
      width?: number;
      height?: number;
      sizeBytes?: number;
    }>;
  }
}

