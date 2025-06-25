import { FastifyInstance } from "fastify";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import priceController from "./controller/priceController";
<<<<<<< feat/price-change-endpoint
import priceChangeController from "./controller/priceChangeController";
=======
import volumeController from "./controller/volumeController";
>>>>>>> main

export default async function router(fastify: FastifyInstance) {
  fastify.register(userController, { prefix: "/api/v1/user" });
  fastify.register(indexController, { prefix: "/" });
  fastify.register(priceController, { prefix: "/api/v1/price" });
<<<<<<< feat/price-change-endpoint
  fastify.register(priceChangeController, { prefix: "/api/v1/priceChange" });
=======
  fastify.register(volumeController, { prefix: "/api/v1/volume" });
>>>>>>> main
}
