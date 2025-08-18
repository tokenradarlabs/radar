import { z } from "zod";

export const deleteApiKeyRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  }),
  apiKeyId: z.string({
    required_error: "API key ID is required",
    invalid_type_error: "API key ID must be a string"
  }).uuid("Invalid API key ID format")
});

export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;
