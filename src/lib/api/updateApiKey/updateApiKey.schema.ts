import { z } from "zod";

export const updateApiKeyRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  }),
  name: z.string({
    required_error: "API key name is required",
    invalid_type_error: "API key name must be a string"
  }).min(1, "API key name cannot be empty").max(100, "API key name cannot exceed 100 characters")
});

export type UpdateApiKeyRequest = z.infer<typeof updateApiKeyRequestSchema>;
