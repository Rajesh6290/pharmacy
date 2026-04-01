import useSWR, { SWRConfiguration } from "swr";
const useSwr = (path: string | null, options?: SWRConfiguration) => {
  const fetcher = async (url: string) => {
    const headers: {
      Authorization?: string;
      "Content-Type"?: string;
      Range?: string;
      "Content-Length"?: string;
    } = {};
    headers["Content-Type"] = "application/json";
    headers["Range"] = "1";
    headers["Content-Length"] = "1";

    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: "Invalid JSON response" };
    }

    return { data, res };
  };

  const { data, error, mutate, isValidating, isLoading } = useSWR(
    path ? `/api/${path}` : null,
    fetcher,
    {
      ...options,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data?.data,
    error,
    isValidating,
    isLoading,
    mutate,
    pagination: data?.data?.pagination,
  };
};

export default useSwr;
