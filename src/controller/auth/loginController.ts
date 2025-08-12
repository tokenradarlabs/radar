import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";
import { UserData } from "../../types/user";
import { generateToken } from "../../utils/auth";

// Define the login schema using Zod
const loginSchema = z.object({
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
type LoginRequest = z.infer<typeof loginSchema>;

export default async function loginController(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginRequest }>(
    "/login",
    async function (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
      try {
        // Validate the request body against the schema
        const validatedData = loginSchema.parse(request.body);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        // If user doesn't exist, return error
        if (!user) {
          const timestamp = new Date().toISOString();
          const response: Response<UserData> = {
            success: false,
            error: `User Does Not Exist (${timestamp})`
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<UserData> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Return user data (excluding password)
        // Generate JWT token
        const token = generateToken({ id: user.id, email: user.email });
        
        const response: Response<UserData & { token: string }> = {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            token: token
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<UserData> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        // Centralized error handling (maps DB outage to 503)
        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
} 