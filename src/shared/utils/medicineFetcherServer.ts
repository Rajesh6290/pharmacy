/**
 * Server-side Medicine Image Fetcher Utility
 * For use in API routes and server components
 *
 * IMPORTANT - FILE STORAGE:
 * -------------------------
 * - Downloaded images are in SERVER MEMORY only (as Buffer objects)
 * - They are NOT automatically saved to disk, cloud, or database
 * - To persist images permanently, upload them to MediaService (Cloudinary)
 *
 * FLOW (API Route):
 * 1. fetchMedicineImageBuffer(name) → Returns Buffer (IN MEMORY)
 * 2. Convert Buffer to File object
 * 3. MediaService.upload(file) → Uploads to Cloudinary (STORED IN CLOUD)
 * 4. Save returned URL to database → Permanent storage
 *
 * @example API Route usage:
 * ```typescript
 * import { fetchMedicineImageBuffer } from "@/shared/utils/medicineFetcherServer";
 *
 * // In API route
 * const imageBuffer = await fetchMedicineImageBuffer("Paracetamol");
 *
 * if (imageBuffer) {
 *   // Convert Buffer to File for MediaService
 *   const blob = new Blob([imageBuffer.buffer], { type: imageBuffer.contentType });
 *   const file = new File([blob], imageBuffer.fileName, { type: imageBuffer.contentType });
 *
 *   // Upload to Cloudinary
 *   const cloudinaryUrl = await MediaService.upload(file);
 *
 *   // Return URL or save to database
 *   return NextResponse.json({ imageUrl: cloudinaryUrl });
 * }
 * ```
 */

interface DamImage {
  url: string;
  face: string;
  sequence: string;
}

interface Product {
  productId: number;
  name: string;
  damImages: DamImage[] | null;
  slug: string;
  subtitleText: string | null;
}

interface PharmEasyResponse {
  status: number;
  data: {
    products: Product[];
  };
}

interface ImageBuffer {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

/**
 * Fetches medicine data from PharmEasy API (Server-side)
 * @param medicineName - Name of the medicine to search for
 * @returns Promise with product data
 */
export async function fetchMedicineData(
  medicineName: string
): Promise<Product[]> {
  try {
    const encodedName = encodeURIComponent(medicineName);
    const url = `https://pharmeasy.in/api/search/searchTypeAhead?intent_id&q=${encodedName}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch medicine data: ${response.statusText}`);
    }

    const data: PharmEasyResponse = await response.json();

    if (data.status !== 1 || !data.data.products) {
      throw new Error("Invalid response from PharmEasy API");
    }

    return data.data.products;
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    throw error;
  }
}

/**
 * Extracts the first available image URL from medicine products
 * @param products - Array of products from PharmEasy
 * @returns First image URL found, or null if no images available
 */
export function extractFirstImageUrl(products: Product[]): string | null {
  for (const product of products) {
    if (product.damImages && product.damImages.length > 0) {
      // Return the first image URL (prefer 'front' face if available)
      const frontImage = product.damImages.find((img) => img.face === "front");
      return frontImage ? frontImage.url : product.damImages[0].url;
    }
  }
  return null;
}

/**
 * Downloads an image from URL and returns as Buffer (Server-side)
 * @param imageUrl - URL of the image to download
 * @returns Promise with image buffer and content type
 */
export async function downloadImageBuffer(
  imageUrl: string
): Promise<ImageBuffer> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Extract filename from URL or generate one
    const urlParts = imageUrl.split("/");
    const fileName =
      urlParts[urlParts.length - 1] || `medicine_${Date.now()}.jpg`;

    return {
      buffer,
      contentType,
      fileName,
    };
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

/**
 * Main function: Fetches medicine image by name and returns as Buffer
 * @param medicineName - Name of the medicine to search for
 * @returns Promise with ImageBuffer object, or null if no image found
 */
export async function fetchMedicineImageBuffer(
  medicineName: string
): Promise<ImageBuffer | null> {
  try {
    // Step 1: Fetch medicine data
    const products = await fetchMedicineData(medicineName);

    if (products.length === 0) {
      console.warn(`No products found for medicine: ${medicineName}`);
      return null;
    }

    // Step 2: Extract first image URL
    const imageUrl = extractFirstImageUrl(products);

    if (!imageUrl) {
      console.warn(`No images found for medicine: ${medicineName}`);
      return null;
    }

    // Step 3: Download image as buffer
    const imageBuffer = await downloadImageBuffer(imageUrl);

    return imageBuffer;
  } catch (error) {
    console.error("Error fetching medicine image:", error);
    return null;
  }
}

/**
 * Fetches all available images for a medicine (Server-side)
 * @param medicineName - Name of the medicine to search for
 * @param limit - Maximum number of images to fetch (default: 5)
 * @returns Promise with array of ImageBuffer objects
 */
export async function fetchAllMedicineImageBuffers(
  medicineName: string,
  limit: number = 5
): Promise<ImageBuffer[]> {
  try {
    const products = await fetchMedicineData(medicineName);
    const buffers: ImageBuffer[] = [];

    let count = 0;
    for (const product of products) {
      if (count >= limit) break;

      if (product.damImages && product.damImages.length > 0) {
        for (const damImage of product.damImages) {
          if (count >= limit) break;

          try {
            const imageBuffer = await downloadImageBuffer(damImage.url);
            buffers.push(imageBuffer);
            count++;
          } catch (error) {
            console.error(`Failed to download image:`, error);
          }
        }
      }
    }

    return buffers;
  } catch (error) {
    console.error("Error fetching all medicine images:", error);
    return [];
  }
}

/**
 * Gets medicine suggestions with image availability info
 * @param medicineName - Name of the medicine to search for
 * @returns Promise with product details including image availability
 */
export async function getMedicineSuggestions(medicineName: string): Promise<
  Array<{
    id: number;
    name: string;
    subtitle: string | null;
    hasImages: boolean;
    imageCount: number;
    firstImageUrl: string | null;
  }>
> {
  try {
    const products = await fetchMedicineData(medicineName);

    return products.map((product) => ({
      id: product.productId,
      name: product.name,
      subtitle: product.subtitleText,
      hasImages: !!(product.damImages && product.damImages.length > 0),
      imageCount: product.damImages?.length || 0,
      firstImageUrl:
        product.damImages && product.damImages.length > 0
          ? product.damImages[0].url
          : null,
    }));
  } catch (error) {
    console.error("Error getting medicine suggestions:", error);
    return [];
  }
}
