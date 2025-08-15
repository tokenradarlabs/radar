import { z } from "zod";


export const apiKeyRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
});

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

export const getApiKeysRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
});


export const getUsageAnalyticsRequestSchema = z.object({
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
  }).uuid("Invalid API key ID format").optional()
});



export type ApiKeyRequest = z.infer<typeof apiKeyRequestSchema>;
export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;
export type UpdateApiKeyRequest = z.infer<typeof updateApiKeyRequestSchema>;
export type GetApiKeysRequest = z.infer<typeof getApiKeysRequestSchema>;
export type GetUsageAnalyticsRequest = z.infer<typeof getUsageAnalyticsRequestSchema>;
