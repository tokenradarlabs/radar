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

  const minDelay = 100; // Minimum delay for backoff in ms
  const maxDelay = 5000; // Maximum delay for backoff in ms

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorBody}`
        );
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId); // Clear timeout if fetch completes or errors before timeout

      if (error.name === 'AbortError' && i < retries) {
        console.warn(
          `Fetch for ${url} timed out, retrying (${
            i + 1
          }/${retries}). Error: ${error.message}`
        );
      } else if (i < retries) {
        console.warn(
          `Fetch failed for ${url}, retrying (${
            i + 1
          }/${retries}). Error: ${error.message}`
        );
      } else {
        console.error(
          `Fetch failed for ${url} after ${retries} retries. Error: ${error.message}`
        );
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        maxDelay,
        minDelay * Math.pow(2, i) + Math.random() * minDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // This part should ideally not be reached, but for type safety
  throw new Error('Unexpected error in fetchWithRetry');
}
