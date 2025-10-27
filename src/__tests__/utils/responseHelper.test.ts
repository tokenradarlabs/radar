import { FastifyReply } from 'fastify';
import {
  sendSuccess,
  errorResponse,
  HTTP_STATUS,
} from '../../utils/responseHelper';
import { vi } from 'vitest';

describe('Response Helpers', () => {
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      getHeader: vi.fn(),
      raw: {
        headersSent: false,
      },
    } as unknown as FastifyReply;
  });

  it('sendSuccess should send a success response with correct shape and status', () => {
    const testData = { message: 'Success!' };
    sendSuccess(mockReply, testData);

    expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: testData,
    });
  });

  it('sendSuccess should send a success response with a custom status', () => {
    const testData = { id: 123 };
    sendSuccess(mockReply, testData, HTTP_STATUS.CREATED);

    expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: testData,
    });
  });

  it('sendError should send an error response with correct shape and status', () => {
    const errorMessage = 'Something went wrong';
    errorResponse(mockReply, HTTP_STATUS.BAD_REQUEST, errorMessage);

    expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: errorMessage,
    });
  });

  it('sendError should send an error response with a custom status', () => {
    const errorMessage = 'Unauthorized access';
    errorResponse(mockReply, HTTP_STATUS.UNAUTHORIZED, errorMessage);

    expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: errorMessage,
    });
  });
});
