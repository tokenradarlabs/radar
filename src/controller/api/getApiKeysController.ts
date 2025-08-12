import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";

// Define the request schema
const getApiKeysRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
});

// Type inference from the Zod schema
type GetApiKeysRequest = z.infer<typeof getApiKeysRequestSchema>;

// Type for API key list response
interface ApiKeyListResponse {
  apiKeys: {
    id: string;
    key: string;
    createdAt: Date;
    isActive: boolean;
  }[];
}

export default async function getApiKeysController(fastify: FastifyInstance) {
  fastify.post<{ Body: GetApiKeysRequest }>(
    "/getApiKeys",
    async function (request: FastifyRequest<{ Body: GetApiKeysRequest }>, reply: FastifyReply) {
      try {
        // Validate the request body against the schema
        const validatedData = getApiKeysRequestSchema.parse(request.body);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        // If user doesn't exist, return error
        if (!user) {
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Fetch API keys for the user
        const apiKeys = await prisma.apiKey.findMany({
          where: {
            userId: user.id
          },
          select: {
            id: true,
            key: true,
            createdAt: true,
            isActive: true
          }
        });

        // Return the API keys
        const response: Response<ApiKeyListResponse> = {
          success: true,
          data: {
            apiKeys
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
} 