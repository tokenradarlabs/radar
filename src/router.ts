import { FastifyInstance } from "fastify";
import rateLimit from '@fastify/rate-limit';
import { loginController, registerController } from "./controller/auth";
import { apiKeyController ,getApiKeysController} from "./controller/api";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import priceController from "./controller/priceController";
import priceChangeController from "./controller/priceChangeController";
import volumeController from "./controller/volumeController";
import devPriceController from "./controller/devPriceController";

export default async function router(fastify: FastifyInstance) {
  // Auth endpoints with rate limiting
  fastify.register(async (fastify) => {
    // Enable rate limiting for all auth routes
    await fastify.register(rateLimit, {
      max: 5,
      timeWindow: '1 minute'
    });
    
    fastify.register(loginController);
    fastify.register(registerController);
  }, { prefix: "/auth" });
  
  // API key management endpoints with rate limiting
  fastify.register(async (fastify) => {
    await fastify.register(rateLimit, {
      max: 5,
      timeWindow: '1 minute'
    });
    
    fastify.register(apiKeyController);
    fastify.register(getApiKeysController);
  }, { prefix: "/api/v1/keys" });
  
  fastify.register(userController, { prefix: "/user" });
  
  // API endpoints
  fastify.register(indexController, { prefix: "/" });
  fastify.register(priceController, { prefix: "/api/v1/price" });
  fastify.register(priceChangeController, { prefix: "/api/v1/priceChange" });
  fastify.register(volumeController, { prefix: "/api/v1/volume" });
  fastify.register(devPriceController, { prefix: "/api/v1/price/dev" });
}
