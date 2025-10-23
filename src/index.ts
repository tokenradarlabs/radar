import { buildApp } from "./app"; // Changed import
import { validateEnvironmentVariables } from "./utils/envValidation";

// Validate environment variables before starting the server
try {
  const env = validateEnvironmentVariables();
const FASTIFY_PORT = Number(env.FASTIFY_PORT) || 3006;

const app = await buildApp(); // Call buildApp to get the server instance
app.listen({ port: FASTIFY_PORT });

console.log(
  `🚀  Fastify server running on port http://localhost:${FASTIFY_PORT}`
);
console.log(`Route index: /`);
console.log(`Route user: /api/v1/user`);
