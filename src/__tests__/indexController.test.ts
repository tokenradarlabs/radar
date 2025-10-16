import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../app'; // Corrected import
import { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import { resolve } from 'path';

// Mock the entire 'fs/promises' module
vi.mock('fs', async (importOriginal) => {
  const original = await importOriginal<typeof fs>();
  return {
    ...original,
    promises: {
      ...original.promises,
      readFile: vi.fn(), // Mock readFile specifically
    },
  };
});

const mockedReadFile = vi.mocked(fs.promises.readFile); // Get a typed mock

describe('Index Controller', () => {
  let app: FastifyInstance; // Declare app here

  beforeEach(async () => {
    app = await buildApp(); // Build a new app for each test
    await app.ready();
    mockedReadFile.mockReset(); // Reset mocks before each test
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it('should return 500 if index.html cannot be read', async () => {
    mockedReadFile.mockImplementation(async (path: fs.PathLike) => {
      if (path.toString().includes('static/index.html')) {
        throw new Error('File not found');
      }
      return Buffer.from('');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: 'Failed to load index.html',
    });
  });

  it('should return index.html content if file exists', async () => {
    const mockHtmlContent = '<html><body>Mock Index</body></html>';
    mockedReadFile.mockImplementation(async (path: fs.PathLike) => {
      if (path.toString().includes('static/index.html')) {
        return Buffer.from(mockHtmlContent);
      }
      return Buffer.from('');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.payload).toBe(mockHtmlContent);
  });
});
