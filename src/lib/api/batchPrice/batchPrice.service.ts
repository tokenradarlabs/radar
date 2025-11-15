
import { getPrice } from '../../price/price.service';
import { BatchPriceInput } from './batchPrice.schema';

export async function getBatchPrices(input: BatchPriceInput) {
  const { tokenIds } = input;
  const results: { [key: string]: any } = {};
  const errors: { [key: string]: string } = {};

  const pricePromises = tokenIds.map(async (tokenId) => {
    try {
      const priceData = await getPrice({ tokenId });
      results[tokenId] = priceData;
    } catch (error: any) {
      errors[tokenId] = error.message || 'Failed to fetch price';
    }
  });

  await Promise.all(pricePromises);

  return { results, errors };
}
