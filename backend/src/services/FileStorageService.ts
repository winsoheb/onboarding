export interface StorageUploadResult {
  fileUrl: string;
  fileKey: string;
}

export class FileStorageService {
  /**
   * Uploads a file (base64 encoded for MVP) and returns the public url and storage key.
   */
  static async uploadFile(
    base64Content: string,
    fileName: string,
    mimeType: string
  ): Promise<StorageUploadResult> {
    // For MVP, we directly return the base64 content as the URL and fileKey
    // In production, this can be changed to write to local uploads dir or S3/Azure blobs.
    return {
      fileUrl: base64Content,
      fileKey: `mvp_${Date.now()}_${fileName}`
    };
  }

  /**
   * Deletes a file from storage.
   */
  static async deleteFile(fileKey: string): Promise<void> {
    // MVP no-op since files are inline in DB
    console.log(`FileStorageService: Mock deleted file with key ${fileKey}`);
  }
}
