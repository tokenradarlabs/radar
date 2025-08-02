import 'dotenv/config';
import { getValidatedEnv } from './envValidation';

// Interface for the Coingecko API response
interface CoinGeckoVolumeDetail {
    usd_24h_vol: number;
}

interface CoinGeckoVolumeResponse {
  [tokenId: string]: CoinGeckoVolumeDetail;
}

/**
 * Fetches the volume data for a specific token from CoinGecko
 * @param tokenId The CoinGecko token ID (e.g., 'bitcoin')
 * @returns The volume data including USD 24h volume
 */
export async function fetchTokenVolume(tokenId: string): Promise<CoinGeckoVolumeDetail | null> {
    const { COINGECKO_API_KEY } = getValidatedEnv();
    const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${tokenId}&include_24hr_vol=true&precision=5`;
    
    const headers: Record<string, string> = {
        'accept': 'application/json',
        'x-cg-demo-api-key': COINGECKO_API_KEY
    };

    const options: RequestInit = {
        method: 'GET',
        headers
    };

    try {
        console.log(`[CoinGecko] Fetching volume for token: ${tokenId}`);
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[CoinGecko] Failed to fetch token volume', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorBody,
            });
            return null;
        }

        const json = await response.json() as CoinGeckoVolumeResponse;
        const tokenData = json[tokenId];

        if (!tokenData || typeof tokenData.usd_24h_vol !== 'number') {
            console.warn('[CoinGecko] Received invalid or unexpected data structure', { response: json });
            return null;
        }

        console.log(`[CoinGecko] Successfully fetched volume for ${tokenId}: $${tokenData.usd_24h_vol}`);
        return tokenData;
    } catch (error) {
        console.error('[CoinGecko] Error fetching or processing token volume', { 
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
        });
        return null;
    }
} 