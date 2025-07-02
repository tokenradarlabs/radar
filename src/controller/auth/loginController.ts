import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";

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
          return reply.code(401).send({
            error: "User Does Not Exist"
          });
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          return reply.code(401).send({
            error: "Invalid credentials"
          });
        }

        // Return user data (excluding password)
        return reply.code(200).send({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
          }
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          return reply.code(400).send({
            error: error.errors[0].message
          });
        }

        // Handle unexpected errors
        console.error('Login error:', error);
        return reply.code(500).send({
          error: "Internal server error"
        });
      }
    }
  );
} 