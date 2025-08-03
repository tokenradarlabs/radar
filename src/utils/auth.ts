import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { getValidatedEnv } from "./envValidation";
import { sendUnauthorized } from "./responseHelper";

// Define the shape of the token payload
export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// This middleware can be used to protect routes that require authentication
export async function authenticateJwt(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return sendUnauthorized(reply, "Authentication required");
  }

  const token = authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"
  const { JWT_SECRET } = getValidatedEnv();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = decoded; // Attach user info to the request
    return;
  } catch (error) {
    return sendUnauthorized(reply, "Invalid or expired token");
  }
}

// This function generates a new JWT token
export function generateToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresIn: number = 24 * 60 * 60
): string {
  const { JWT_SECRET } = getValidatedEnv();
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Declare module augmentation to add user property to FastifyRequest
declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
