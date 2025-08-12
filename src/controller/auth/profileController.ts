import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateJwt } from "../../utils/auth";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";
import { UserData } from "../../types/user";
import { prisma } from "../../utils/prisma";

export default async function profileController(fastify: FastifyInstance) {
  // GET /auth/profile - Protected route that requires authentication
  fastify.get(
    "/profile",
    { preHandler: authenticateJwt }, // Use the JWT authentication middleware
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Get the authenticated user data
        const userId = request.user?.id;
        
        if (!userId) {
          const response: Response<UserData> = {
            success: false,
            error: "Authentication required"
          };
          return reply.code(401).send(response);
        }

        // Fetch the latest user data
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            // You can also include related data like alerts
            _count: {
              select: {
                alerts: true,
                apiKeys: true
              }
            }
          }
        });

        if (!user) {
          const response: Response<UserData> = {
            success: false,
            error: "User not found"
          };
          return reply.code(404).send(response);
        }

        // Return user profile data
        const response: Response<any> = {
          success: true,
          data: {
            ...user,
            // Don't include the actual JWT token in the response
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
}
