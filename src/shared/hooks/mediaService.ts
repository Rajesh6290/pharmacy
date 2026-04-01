import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "./servenEnv";

// Configure Cloudinary
cloudinary.config(getCloudinaryConfig());

export interface UploadedMedia {
  id: string;
  url: string;
  type: string; // 'image', 'video', 'pdf', etc.
  publicId: string;
}

export class MediaService {
  /**
   * Upload a single file to Cloudinary
   */
  static async uploadFile(file: File): Promise<UploadedMedia> {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Only JPEG, PNG, WebP images, MP4/WebM/MOV videos, and PDF files are allowed"
      );
    }

    // Determine file type and resource type
    let fileType: string;
    let resourceType: "image" | "video" | "raw";

    if (file.type.startsWith("image/")) {
      fileType = "image";
      resourceType = "image";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
      resourceType = "video";
    } else if (file.type === "application/pdf") {
      fileType = "pdf";
      resourceType = "raw";
    } else {
      fileType = "other";
      resourceType = "raw";
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadOptions = {
        folder: "samrudhi-trust/pharmacy-images",
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [
                { width: 1200, height: 1200, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ]
            : undefined,
      };

      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (
            error: Error | undefined,
            result: { secure_url: string; public_id: string } | undefined
          ) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Upload failed"));
          }
        )
        .end(buffer);
    });

    return {
      id: result.public_id,
      url: result.secure_url,
      type: fileType,
      publicId: result.public_id,
    };
  }

  /**
   * Upload multiple files to Cloudinary
   */
  static async uploadMultipleFiles(files: File[]): Promise<UploadedMedia[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw new Error("Failed to delete file from cloud storage");
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  static async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      console.error("Failed to delete files:", error);
      throw new Error("Failed to delete files from cloud storage");
    }
  }
}
