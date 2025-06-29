import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";

// Define the registration schema using Zod
const registerSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  }).min(8, "Password must be at least 8 characters long"),
});

// Type inference from the Zod schema
type RegisterRequest = z.infer<typeof registerSchema>;

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

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

        // TODO: Add actual user creation logic here
        // For now, we'll just return success without storing the user
        return reply.code(201).send({
          message: "User registered successfully",
          email: validatedData.email,
          // Note: Never return hashed password in response
        });
      } catch (error) {
          
        if (error instanceof z.ZodError) {
          // Return validation errors
          return reply.code(400).send({
            error: error.errors[0].message
          });
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
