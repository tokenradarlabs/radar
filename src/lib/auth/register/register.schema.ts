import { z } from "zod";
import { emailSchema, strongPasswordSchema } from "../common/schemas";

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: Date;
}
