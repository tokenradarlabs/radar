import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { UserData } from "../../types/user";

// Define the registration schema using Zod
const registerSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
});

// Type inference from the Zod schema
type RegisterRequest = z.infer<typeof registerSchema>;

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

// Type guard for Prisma errors
function isPrismaError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error;
}

export default async function registerController(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterRequest }>(
    "/register",
    async function (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
      try {
        // Validate the request body against the schema
        const validatedData = registerSchema.parse(request.body);

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

        // Create the user in the database
        const user = await prisma.user.create({
          data: {
            email: validatedData.email,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        });

        const response: Response<UserData> = {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
          }
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<UserData> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        if (isPrismaError(error)) {
          // Handle unique constraint violation (duplicate email)
          if (error.code === 'P2002') {
            const response: Response<UserData> = {
              success: false,
              error: "Email already exists"
            };
            return reply.code(409).send(response);
          }
        }
        
        // Handle unexpected errors
        console.error('Registration error:', error);
        const response: Response<UserData> = {
          success: false,
          error: "Internal server error"
        };
        return reply.code(500).send(response);
      }
    }
  );
} 