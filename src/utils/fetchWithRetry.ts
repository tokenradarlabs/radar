
import { RequestInit } from 'node-fetch';

interface FetchOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

/**
 * Fetches a URL with retry and timeout logic.
 * @param url The URL to fetch.
 * @param options Fetch options, including optional retries and timeout.
 * @returns The response from the fetch call.
 * @throws An error if the fetch fails after all retries or if a timeout occurs.
 */
export async function fetchWithRetry(
  url: string,
  options?: FetchOptions
): Promise<Response> {
  const { retries = 3, timeout = 5000, ...fetchOptions } = options || {};

  for (let i = 0; i <= retries; i++) {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        // If response is not ok, but not a network error, we might still want to retry
        // depending on the status code. For now, we'll just throw.
        const errorBody = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorBody}`
        );
      }

      return response;
    } catch (error: any) {
      if (i < retries) {
        console.warn(
          `Fetch failed for ${url}, retrying (${
            i + 1
          }/${retries}). Error: ${error.message}`
        );
        // Simple exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
      } else {
        console.error(
          `Fetch failed for ${url} after ${retries} retries. Error: ${error.message}`
        );
        throw error;
      }
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }
  // This part should ideally not be reached, but for type safety
  throw new Error('Unexpected error in fetchWithRetry');
}
