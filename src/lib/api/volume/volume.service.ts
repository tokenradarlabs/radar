import { fetchTokenVolume } from '../../../utils/coinGeckoVolume';
import { TokenVolumeData } from './volume.schema';

export class VolumeService {
  static async getTokenVolume(tokenId: string): Promise<TokenVolumeData> {
    const volumeData = await fetchTokenVolume(tokenId);

    if (!volumeData) {
      throw new Error('Token volume data not found');
    }

    return {
      volume: volumeData.usd_24h_vol,
      tokenId,
      period: '24h',
    };
  }
}
