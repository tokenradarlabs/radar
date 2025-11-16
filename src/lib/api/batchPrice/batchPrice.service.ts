import { getPrice } from '../price/price.service';
import { BatchPriceInput } from './batchPrice.schema';

export async function getBatchPrices(input: BatchPriceInput) {
  const { tokenIds } = input;
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  const pricePromises = tokenIds.map(async (tokenId) => {
    try {
      const priceData = await getPrice({ tokenId });
      results[tokenId] = priceData;
    } catch (error: unknown) {
      errors[tokenId] = error instanceof Error ? error.message : String(error);
    }
  });

  await Promise.all(pricePromises);

  return { results, errors };
}
