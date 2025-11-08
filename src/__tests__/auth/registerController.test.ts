import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerController } from '../../controller/auth';
import { RegisterService, registerRequestSchema } from '../../lib/auth';
import { handleControllerError } from '../../utils/responseHelper';
import { ZodError } from 'zod';
import { formatValidationError } from '../../utils/validation';

// Mock dependencies
vi.mock('../../lib/auth', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../lib/auth')>();
  return {
    ...mod,
    RegisterService: {
      registerUser: vi.fn(),
    },
    registerRequestSchema: {
      parse: vi.fn(),
    },
  };
});

vi.mock('../../utils/responseHelper', () => ({
  handleControllerError: vi.fn(),
}));

vi.mock('../../utils/validation', () => ({
  formatValidationError: vi.fn(),
}));

describe('User Registration Endpoint (Unit)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(registerController, { prefix: '/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    vi.resetAllMocks();
  });

  // Reset mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully register a new user with valid data', async () => {
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };
    const mockRegisteredUser = {
      id: 'some-uuid',
      email: testUser.email,
      createdAt: new Date(),
    };

    (registerRequestSchema.parse as vi.Mock).mockReturnValue(testUser);
    (RegisterService.registerUser as vi.Mock).mockResolvedValue(
      mockRegisteredUser
    );

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: testUser,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockRegisteredUser);
    expect(registerRequestSchema.parse).toHaveBeenCalledWith(testUser);
    expect(RegisterService.registerUser).toHaveBeenCalledWith(testUser);
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should return 400 for validation errors', async () => {
    const invalidUserData = {
      email: 'invalid-email',
      password: 'short',
    };
    const zodError = new ZodError([
      {
        code: 'invalid_string',
        message: 'Invalid email format',
        path: ['email'],
        validation: 'email',
      },
    ]);

    (registerRequestSchema.parse as vi.Mock).mockImplementation(() => {
      throw zodError;
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: invalidUserData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid email format');
    expect(registerRequestSchema.parse).toHaveBeenCalledWith(invalidUserData);
    expect(RegisterService.registerUser).not.toHaveBeenCalled();
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid payloads with multiple validation errors', async () => {
    const invalidUserData = {
      email: 'not-an-email',
      password: 'weak',
    };
    const zodError = new ZodError([
      {
        code: 'invalid_string',
        message: 'Invalid email format',
        path: ['email'],
        validation: 'email',
      },
      {
        code: 'too_small',
        minimum: 8,
        type: 'string',
        inclusive: true,
        message: 'Password must be at least 8 characters long',
        path: ['password'],
      },
    ]);

    (registerRequestSchema.parse as vi.Mock).mockImplementation(() => {
      throw zodError;
    });
    (formatValidationError as vi.Mock).mockReturnValue('Invalid email format');

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: invalidUserData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid email format');
    expect(registerRequestSchema.parse).toHaveBeenCalledWith(invalidUserData);
    expect(formatValidationError).toHaveBeenCalledWith(zodError);
    expect(RegisterService.registerUser).not.toHaveBeenCalled();
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should return 409 for duplicate email registration', async () => {
    const duplicateUser = {
      email: 'duplicate@example.com',
      password: 'TestPassword123!',
    };

    (registerRequestSchema.parse as vi.Mock).mockReturnValue(duplicateUser);
    (RegisterService.registerUser as vi.Mock).mockRejectedValue(
      new Error('Email already exists')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: duplicateUser,
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Email already exists');
    expect(registerRequestSchema.parse).toHaveBeenCalledWith(duplicateUser);
    expect(RegisterService.registerUser).toHaveBeenCalledWith(duplicateUser);
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should call handleControllerError for generic internal server errors', async () => {
    const genericErrorUser = {
      email: 'generic@example.com',
      password: 'TestPassword123!',
    };
    const genericError = new Error('Something unexpected happened');

    (registerRequestSchema.parse as vi.Mock).mockReturnValue(genericErrorUser);
    (RegisterService.registerUser as vi.Mock).mockRejectedValue(genericError);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: genericErrorUser,
    });

    // Expect a 500 status code as handleControllerError sends it
    expect(response.statusCode).toBe(500);
    expect(registerRequestSchema.parse).toHaveBeenCalledWith(genericErrorUser);
    expect(RegisterService.registerUser).toHaveBeenCalledWith(genericErrorUser);
    expect(handleControllerError).toHaveBeenCalledWith(
      expect.anything(),
      genericError,
      'Internal server error'
    );
  });
});
