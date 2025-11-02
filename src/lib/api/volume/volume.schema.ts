import { z } from 'zod';

import {
  volumeTokenIdSchema,
  VolumeTokenIdParams,
} from '../../utils/validation';

export { volumeTokenIdSchema };

export interface TokenVolumeParams extends VolumeTokenIdParams {}

export interface TokenVolumeData {
  volume: number;
  tokenId: string;
  period: string;
}

export type VolumeTokenIdRequest = z.infer<typeof volumeTokenIdSchema>;
