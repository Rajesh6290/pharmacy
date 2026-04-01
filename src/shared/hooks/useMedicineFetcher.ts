import { useState } from "react";

interface MedicineSuggestion {
  id: number;
  name: string;
  subtitle: string | null;
  hasImages: boolean;
  imageCount: number;
  firstImageUrl: string | null;
}

interface UseMedicineFetcherReturn {
  suggestions: MedicineSuggestion[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (medicineName: string) => Promise<void>;
  fetchAndDownloadImage: (medicineName: string) => Promise<Blob | null>;
  getImageUrl: (medicineName: string) => string;
}

/**
 * Custom hook to fetch medicine data and images from PharmEasy API
 *
 * IMPORTANT: Downloaded images are in MEMORY only (as Blob/File objects).
 * They are NOT automatically saved to disk or cloud storage.
 *
 * To persist images, you MUST upload them to MediaService (Cloudinary):
 *
 * @example
 * ```tsx
 * import useMedicineFetcher from "@/shared/hooks/useMedicineFetcher";
 * import MediaService from "@/shared/hooks/mediaService";
 *
 * const { fetchAndDownloadImage } = useMedicineFetcher();
 *
 * // Step 1: Fetch image from PharmEasy (in memory)
 * const blob = await fetchAndDownloadImage("Paracetamol");
 *
 * // Step 2: Convert to File (still in memory)
 * const file = new File([blob], "medicine.jpg", { type: blob.type });
 *
 * // Step 3: Upload to Cloudinary via MediaService (NOW it's stored)
 * const imageUrl = await MediaService.upload(file);
 *
 * // Step 4: Save imageUrl to database with medicine record
 * const medicine = { name: "Paracetamol", image: imageUrl };
 * await mutation("/api/medicines", { method: "POST", body: medicine });
 * ```
 */
export default function useMedicineFetcher(): UseMedicineFetcherReturn {
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch medicine suggestions with image availability
   */
  const fetchSuggestions = async (medicineName: string) => {
    if (!medicineName.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/medicines/fetch-image?medicineName=${encodeURIComponent(medicineName)}&action=suggestions`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const result = await response.json();
      setSuggestions(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch suggestions"
      );
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch and download medicine image as Blob
   */
  const fetchAndDownloadImage = async (
    medicineName: string
  ): Promise<Blob | null> => {
    if (!medicineName.trim()) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/medicines/fetch-image?medicineName=${encodeURIComponent(medicineName)}&action=image`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No image found for this medicine");
        }
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();
      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch image");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get image URL for direct use in img tag (proxied through API)
   */
  const getImageUrl = (medicineName: string): string => {
    return `/api/medicines/fetch-image?medicineName=${encodeURIComponent(medicineName)}&action=image`;
  };

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    fetchAndDownloadImage,
    getImageUrl,
  };
}
