import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { loginController } from '../../controller/auth';
import { LoginService, loginRequestSchema } from '../../lib/auth';
import { handleControllerError } from '../../utils/responseHelper';
import { ZodError } from 'zod';

// Mock dependencies
vi.mock('../../lib/auth', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../lib/auth')>();
  return {
    ...mod,
    LoginService: {
      loginUser: vi.fn(),
    },
    loginRequestSchema: {
      parse: vi.fn(),
    },
  };
});

vi.mock('../../utils/responseHelper', () => ({
  handleControllerError: vi.fn(),
}));

describe('User Login Endpoint (Unit)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(loginController, { prefix: '/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    vi.resetAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully login with valid credentials', async () => {
    const testUser = {
      email: 'login@example.com',
      password: 'TestPassword123!',
    };
    const mockLoggedInUser = {
      id: 'some-uuid',
      email: testUser.email,
      createdAt: new Date(),
      token: 'mock-jwt-token',
    };

    (loginRequestSchema.parse as vi.Mock).mockReturnValue(testUser);
    (LoginService.loginUser as vi.Mock).mockResolvedValue(mockLoggedInUser);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: testUser,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockLoggedInUser);
    expect(loginRequestSchema.parse).toHaveBeenCalledWith(testUser);
    expect(LoginService.loginUser).toHaveBeenCalledWith(testUser);
    expect(sendInternalError).not.toHaveBeenCalled();
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

    (loginRequestSchema.parse as vi.Mock).mockImplementation(() => {
      throw zodError;
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: invalidUserData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid email format');
    expect(loginRequestSchema.parse).toHaveBeenCalledWith(invalidUserData);
    expect(LoginService.loginUser).not.toHaveBeenCalled();
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should return 401 for user not found', async () => {
    const nonExistentUser = {
      email: 'nonexistent@example.com',
      password: 'TestPassword123!',
    };

    (loginRequestSchema.parse as vi.Mock).mockReturnValue(nonExistentUser);
    (LoginService.loginUser as vi.Mock).mockRejectedValue(
      new Error('User Does Not Exist')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: nonExistentUser,
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('User Does Not Exist');
    expect(loginRequestSchema.parse).toHaveBeenCalledWith(nonExistentUser);
    expect(LoginService.loginUser).toHaveBeenCalledWith(nonExistentUser);
    expect(sendInternalError).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid credentials', async () => {
    const wrongPasswordUser = {
      email: 'wrongpass@example.com',
      password: 'WrongPassword123!',
    };

    (loginRequestSchema.parse as vi.Mock).mockReturnValue(wrongPasswordUser);
    (LoginService.loginUser as vi.Mock).mockRejectedValue(
      new Error('Invalid credentials')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: wrongPasswordUser,
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid credentials');
    expect(loginRequestSchema.parse).toHaveBeenCalledWith(wrongPasswordUser);
    expect(LoginService.loginUser).toHaveBeenCalledWith(wrongPasswordUser);
    expect(handleControllerError).not.toHaveBeenCalled();
  });

  it('should call sendInternalError for generic internal server errors', async () => {
    const genericErrorUser = {
      email: 'generic@example.com',
      password: 'TestPassword123!',
    };
    const genericError = new Error('Something unexpected happened');

    (loginRequestSchema.parse as vi.Mock).mockReturnValue(genericErrorUser);
    (LoginService.loginUser as vi.Mock).mockRejectedValue(genericError);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: genericErrorUser,
    });

    // Expect a 500 status code as handleControllerError sends it
    expect(response.statusCode).toBe(500);
    expect(loginRequestSchema.parse).toHaveBeenCalledWith(genericErrorUser);
    expect(LoginService.loginUser).toHaveBeenCalledWith(genericErrorUser);
    expect(sendInternalError).toHaveBeenCalledWith(
      expect.anything(),
      'Internal server error'
    );
  });
});
