"use client";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";

type MutationOptions = {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  isFormData?: boolean;
  BASE_URL?: string;
  body?: unknown;
  isAlert?: boolean;
  onProgress?: (progress: number) => void;
  type?: string;
};

const useMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pendingRequestsRef = useRef<Map<string, boolean>>(new Map());

  const mutation = useCallback(
    async (path: string, options?: MutationOptions) => {
      const requestKey = `${path}-${JSON.stringify(options?.body)}`;
      if (pendingRequestsRef.current.get(requestKey)) {
        return;
      }
      pendingRequestsRef.current.set(requestKey, true);
      setIsLoading(true);

      try {
        const method = options?.method || "POST";
        const body = options?.isFormData
          ? (options.body as FormData)
          : JSON.stringify(options?.body);

        const headers: Record<string, string> = {};
        if (!options?.isFormData) {
          headers["Content-Type"] = "application/json";
        }
        if (options?.type) {
          headers["Type"] = options.type;
        }

        const response = await fetch(`/api/${path}`, {
          method,
          headers,
          body,
          credentials: "include",
        });

        const results = await response.json();
        const status = response.status;

        if (options?.isAlert) {
          if (results?.success) {
            toast.success(results?.message);
          } else {
            toast.error(results?.error?.message || results?.message);
          }
        }

        return { results, status };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Something went wrong";

        if (options?.isAlert) {
          toast.error(errorMessage);
        }

        return {
          results: { error: errorMessage },
          status: 500,
        };
      } finally {
        // Clear this request from pending
        pendingRequestsRef.current.delete(requestKey);
        setIsLoading(false);
      }
    },
    []
  );

  return { mutation, isLoading };
};

export default useMutation;
