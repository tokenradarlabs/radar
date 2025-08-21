import { z } from 'zod';

export const volumeTokenIdSchema = z.object({
  tokenId: z.string({
    required_error: "Token ID is required",
    invalid_type_error: "Token ID must be a string"
  })
});

export interface TokenVolumeParams {
  tokenId: string;
}

export interface TokenVolumeData {
  volume: number;
  tokenId: string;
  period: string;
}

export type VolumeTokenIdRequest = z.infer<typeof volumeTokenIdSchema>;
