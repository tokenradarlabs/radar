import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";

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

export default async function userController(fastify: FastifyInstance) {
  // POST /auth/register
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

        return reply.code(201).send({
          message: "User registered successfully",
          user,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          return reply.code(400).send({
            error: error.errors[0].message
          });
        }

        if (isPrismaError(error)) {
          // Handle unique constraint violation (duplicate email)
          if (error.code === 'P2002') {
            return reply.code(409).send({
              error: "Email already exists"
            });
          }
        }
        
        // Handle unexpected errors
        console.error('Registration error:', error);
        return reply.code(500).send({
          error: "Internal server error"
        });
      }
    }
  );

  // GET /auth/
  fastify.get("/", async function (
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    reply.send({
      balance: "$3,277.32",
      picture: "http://placehold.it/32x32",
      age: 30,
      name: "Leonor Cross",
      gender: "female",
      company: "GRONK",
      email: "leonorcross@gronk.com",
    });
  });
}
