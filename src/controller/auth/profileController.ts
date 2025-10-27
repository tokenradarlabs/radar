import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateJwt } from '../../utils/auth';
import { Response } from '../../types/responses';
import { handleControllerError } from '../../utils/responseHelper';
import { IAuthUser } from '../../types/user';
import { ProfileService, ProfileResponse } from '../../lib/auth';

export default async function profileController(fastify: FastifyInstance) {
  // GET /auth/profile - Protected route that requires authentication
  fastify.get(
    '/profile',
    { preHandler: authenticateJwt }, // Use the JWT authentication middleware
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Get the authenticated user data
        const userId = request.user?.id;

        if (!userId) {
          const response: Response<IAuthUser> = {
            success: false,
            error: 'Authentication required',
          };
          return reply.code(401).send(response);
        }

        // Use the ProfileService to get user profile
        const userProfile = await ProfileService.getUserProfile(userId);

        // Return user profile data
        const response: Response<ProfileResponse> = {
          success: true,
          data: userProfile,
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          const response: Response<IAuthUser> = {
            success: false,
            error: 'User not found',
          };
          return reply.code(404).send(response);
        }

        handleControllerError(reply, error, 'Internal server error');
        return;
      }
    }
  );
}
