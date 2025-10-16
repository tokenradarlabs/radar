import { z } from 'zod';
import { emailSchema, passwordSchema } from '../common/schemas';

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface LoginResponse {
  id: string;
  email: string;
  createdAt: Date;
  token: string;
}
