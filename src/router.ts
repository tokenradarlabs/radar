import { FastifyInstance } from "fastify";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import priceController from "./controller/priceController";
import volumeController from "./controller/volumeController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(userController, { prefix: "/api/v1/user" });
  fastify.register(indexController, { prefix: "/" });
  fastify.register(priceController, { prefix: "/api/v1/price" });
  fastify.register(volumeController, { prefix: "/api/v1/volume" });
}
