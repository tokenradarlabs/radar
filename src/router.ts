import { FastifyInstance } from "fastify";
import { loginController, registerController } from "./controller/auth";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import priceController from "./controller/priceController";
import priceChangeController from "./controller/priceChangeController";
import volumeController from "./controller/volumeController";

export default async function router(fastify: FastifyInstance) {
  // Auth endpoints
  fastify.register(async (fastify) => {
    fastify.register(loginController);
    fastify.register(registerController);
  }, { prefix: "/auth" });
  
  fastify.register(userController, { prefix: "/user" });
  
  // API endpoints
  fastify.register(indexController, { prefix: "/" });
  fastify.register(priceController, { prefix: "/api/v1/price" });
  fastify.register(priceChangeController, { prefix: "/api/v1/priceChange" });
  fastify.register(volumeController, { prefix: "/api/v1/volume" });
}
