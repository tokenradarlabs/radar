import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";
import { UserData } from "../../types/user";
import { 
  registerRequestSchema, 
  RegisterRequest, 
  RegisterService 
} from "../../lib/auth";

export default async function registerController(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterRequest }>(
    "/register",
    async function (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
      try {
        const validatedData = registerRequestSchema.parse(request.body);
        const user = await RegisterService.registerUser(validatedData);

        const response: Response<UserData> = {
          success: true,
          data: user
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<UserData> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        if (error instanceof Error && error.message === "Email already exists") {
          const response: Response<UserData> = {
            success: false,
            error: error.message
          };
          return reply.code(409).send(response);
        }
        
        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
} 