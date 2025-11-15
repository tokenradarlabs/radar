import { Request, Response, NextFunction } from 'express';
import { historicalPriceSchema } from '../../lib/api/historicalPrice/historicalPrice.schema';
import { getHistoricalPriceService } from '../../lib/api/historicalPrice/historicalPrice.service';
import { sendSuccessResponse } from '../../utils/responseHelper';
import { logger } from '../../utils/logger';

export async function getHistoricalPriceController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, vs_currency, days } = historicalPriceSchema.parse(req.query);

    logger.info(
      `Fetching historical price for token: ${id}, currency: ${vs_currency}, days: ${days}`
    );

    const historicalPriceData = await getHistoricalPriceService({
      id,
      vs_currency,
      days: days as any, // Type assertion due to zod transform
    });

    if (!historicalPriceData) {
      return sendSuccessResponse(
        res,
        404,
        'Historical price data not found',
        null
      );
    }

    sendSuccessResponse(
      res,
      200,
      'Historical price data fetched successfully',
      historicalPriceData
    );
  } catch (error) {
    logger.error(`Error fetching historical price: ${error.message}`);
    next(error);
  }
}
