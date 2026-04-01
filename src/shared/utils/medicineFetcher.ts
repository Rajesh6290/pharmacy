/**
 * Medicine Image Fetcher Utility (Client-side)
 * Fetches medicine data and images from PharmEasy API
 *
 * IMPORTANT - FILE STORAGE:
 * -------------------------
 * - Downloaded images are in BROWSER MEMORY only (as Blob/File objects)
 * - They are NOT automatically saved to disk, cloud, or database
 * - To persist images permanently, upload them to MediaService (Cloudinary)
 *
 * FLOW:
 * 1. fetchMedicineImage(name) → Returns File object (IN MEMORY)
 * 2. MediaService.upload(file) → Uploads to Cloudinary (STORED IN CLOUD)
 * 3. Save returned URL to database → Permanent storage
 *
 * @example Basic usage:
 * ```typescript
 * import { fetchMedicineImage } from "@/shared/utils/medicineFetcher";
 *
 * // Get image file (in memory only)
 * const imageFile = await fetchMedicineImage("Paracetamol");
 *
 * if (imageFile) {
 *   // Now upload to persist it
 *   const cloudinaryUrl = await MediaService.upload(imageFile);
 *
 *   // Save URL to database
 *   await saveMedicine({ name: "Paracetamol", image: cloudinaryUrl });
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

/**
 * Fetches medicine data from PharmEasy API
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
      // Return the first image URL
      return product.damImages[0].url;
    }
  }
  return null;
}

/**
 * Downloads an image from URL and returns as Blob
 * @param imageUrl - URL of the image to download
 * @returns Promise with image Blob
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
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

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

/**
 * Main function: Fetches medicine image by name and returns as File
 * @param medicineName - Name of the medicine to search for
 * @returns Promise with File object, or null if no image found
 */
export async function fetchMedicineImage(
  medicineName: string
): Promise<File | null> {
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

    // Step 3: Download image
    const imageBlob = await downloadImage(imageUrl);

    // Step 4: Convert Blob to File
    const fileName = `${medicineName.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
    const imageFile = new File([imageBlob], fileName, {
      type: imageBlob.type || "image/jpeg",
    });

    return imageFile;
  } catch (error) {
    console.error("Error fetching medicine image:", error);
    return null;
  }
}

/**
 * Fetches all available images for a medicine
 * @param medicineName - Name of the medicine to search for
 * @returns Promise with array of File objects
 */
export async function fetchAllMedicineImages(
  medicineName: string
): Promise<File[]> {
  try {
    const products = await fetchMedicineData(medicineName);
    const files: File[] = [];

    for (const product of products) {
      if (product.damImages && product.damImages.length > 0) {
        for (let i = 0; i < product.damImages.length; i++) {
          const imageUrl = product.damImages[i].url;
          try {
            const imageBlob = await downloadImage(imageUrl);
            const fileName = `${product.name.replace(/\s+/g, "_")}_${i + 1}_${Date.now()}.jpg`;
            const imageFile = new File([imageBlob], fileName, {
              type: imageBlob.type || "image/jpeg",
            });
            files.push(imageFile);
          } catch (error) {
            console.error(`Failed to download image ${i + 1}:`, error);
          }
        }
      }
    }

    return files;
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
    }));
  } catch (error) {
    console.error("Error getting medicine suggestions:", error);
    return [];
  }
}
