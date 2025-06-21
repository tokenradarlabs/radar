import 'dotenv/config';


// Interface for the Coingecko API response
interface CoinGeckoPriceDetail {
  usd: number;
}

interface CoinGeckoPriceResponse {
  [tokenId: string]: CoinGeckoPriceDetail;
}

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

if (!COINGECKO_API_KEY) {
    throw new Error('COINGECKO_API_KEY is required but not set in environment variables');
}

/**
 * Fetches the price data for a specific token from CoinGecko
 * @param tokenId The CoinGecko token ID (e.g., 'bitcoin')
 * @returns The price data including USD price
 */
export async function fetchTokenPrice(tokenId: string): Promise<CoinGeckoPriceDetail | null> {
    const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${tokenId}&precision=5`;
    
    // We can safely assert this type since we checked COINGECKO_API_KEY is not undefined above
    const headers: Record<string, string> = {
        'accept': 'application/json',
        'x-cg-demo-api-key': COINGECKO_API_KEY as string
    };

    const options: RequestInit = {
        method: 'GET',
        headers
    };

    try {
        console.log(`[CoinGecko] Fetching price for token: ${tokenId}`);
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[CoinGecko] Failed to fetch token price', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorBody,
            });
            return null;
        }

        const json = await response.json() as CoinGeckoPriceResponse;
        const tokenData = json[tokenId];

        if (!tokenData || typeof tokenData.usd !== 'number') {
            console.warn('[CoinGecko] Received invalid or unexpected data structure', { response: json });
            return null;
        }

        console.log(`[CoinGecko] Successfully fetched price for ${tokenId}: $${tokenData.usd}`);
        return tokenData;
    } catch (error) {
        console.error('[CoinGecko] Error fetching or processing token price', { 
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
        });
        return null;
    }
} 