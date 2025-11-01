import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

describe('fetchWithRetry', () => {
  const mockUrl = 'http://test.com';
  const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Success' }) };
  const mockErrorResponse = { ok: false, text: () => Promise.resolve('Not Found'), status: 404, statusText: 'Not Found' };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch successfully on the first attempt', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as Response);

    const promise = fetchWithRetry(mockUrl, { retries: 0 });
    vi.runAllTimers();

    await expect(promise).resolves.toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed after a failure', async () => {
    vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse as Response);

    const promise = fetchWithRetry(mockUrl, { retries: 1 });
    vi.runAllTimers(); // For initial fetch and potential retry timeout

    await expect(promise).resolves.toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should fail after all retries are exhausted', async () => {
    vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network error 1'))
      .mockRejectedValueOnce(new Error('Network error 2'));

    const promise = fetchWithRetry(mockUrl, { retries: 1 });
    vi.runAllTimers();

    await expect(promise).rejects.toThrow('Network error 2');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if response is not ok after all retries', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(mockErrorResponse as Response);

    const promise = fetchWithRetry(mockUrl, { retries: 0 });
    vi.runAllTimers();

    await expect(promise).rejects.toThrow('HTTP error! status: 404, body: Not Found');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should timeout if the response takes too long', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve(mockResponse as Response), 1000));
    });

    const promise = fetchWithRetry(mockUrl, { timeout: 500, retries: 0 });
    vi.advanceTimersByTime(500);

    await expect(promise).rejects.toThrow('AbortError');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should succeed if response is within timeout', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve(mockResponse as Response), 100));
    });

    const promise = fetchWithRetry(mockUrl, { timeout: 500, retries: 0 });
    vi.advanceTimersByTime(100);

    await expect(promise).resolves.toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
