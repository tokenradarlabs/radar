import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface RegisterRequest {
  email: string;
  password: string;
}

export default async function userController(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post<{ Body: RegisterRequest }>(
    "/register",
    async function (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
      const { email, password } = request.body;

      // Required field validation
      if (!email || !password) {
        return reply.code(400).send({
          error: "Email and password are required"
        });
      }

      // Password length validation (≥8 characters)
      if (password.length < 8) {
        return reply.code(400).send({
          error: "Password must be at least 8 characters long"
        });
      }

      // Basic email format validation (regex)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.code(400).send({
          error: "Invalid email format"
        });
      }

      // TODO: Add actual user creation logic here
      // For now, just return success
      return reply.code(201).send({
        message: "User registered successfully",
        email
      });
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
