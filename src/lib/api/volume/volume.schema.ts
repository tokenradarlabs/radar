import { z } from 'zod';
import { REQUIRED_ERROR, INVALID_TYPE_ERROR } from '../../utils/validation';

export const volumeTokenIdSchema = z.object({
  tokenId: z.string({
    required_error: REQUIRED_ERROR,
    invalid_type_error: INVALID_TYPE_ERROR,
  }),
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
