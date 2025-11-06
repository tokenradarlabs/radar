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
    let timeoutAborted = false;
    const timeoutId = setTimeout(() => {
      timeoutAborted = true;
      controller.abort();
    }, timeout);

    let signalToUse = controller.signal;
    let externalSignalListener: (() => void) | undefined;

    if (fetchOptions.signal) {
      // Check if AbortSignal.any is available (Node.js 20+)
      if (typeof AbortSignal.any === 'function') {
        signalToUse = AbortSignal.any([controller.signal, fetchOptions.signal]);
      } else {
        // Fallback for older Node.js versions: attach listener
        if (fetchOptions.signal.aborted) {
          controller.abort(fetchOptions.signal.reason);
        } else {
          externalSignalListener = () => {
            controller.abort(fetchOptions.signal.reason);
          };
          fetchOptions.signal.addEventListener('abort', externalSignalListener);
        }
                  signalToUse = controller.signal; // Still use the internal signal, but it will be aborted by external
              }
            }
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: signalToUse,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorBody}`
        );
      }

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError' && !timeoutAborted) {
        // This is an external abort, rethrow immediately
        throw error;
      }

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
    } finally {
      clearTimeout(timeoutId);
      if (fetchOptions.signal && externalSignalListener) {
        fetchOptions.signal.removeEventListener('abort', externalSignalListener);
      }
    }
  }
  // This part should ideally not be reached, but for type safety
  throw new Error('Unexpected error in fetchWithRetry');
}
