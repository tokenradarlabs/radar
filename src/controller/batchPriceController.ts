
import { Request, Response } from 'express';
import { getBatchPrices } from '../lib/api/batchPrice/batchPrice.service';
import { batchPriceSchema } from '../lib/api/batchPrice/batchPrice.schema';
import { AppError } from '../utils/errors';

export async function batchPriceController(req: Request, res: Response) {
  try {
    const validatedInput = batchPriceSchema.parse(req.body);
    const { results, errors } = await getBatchPrices(validatedInput);

    if (Object.keys(errors).length > 0) {
      // Partial failure
      return res.status(207).json({
        message: 'Partial success: some prices could not be fetched.',
        data: results,
        errors: errors,
      });
    } else {
      // All successful
      return res.status(200).json({
        message: 'Successfully fetched all prices.',
        data: results,
      });
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
