import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { getBatchPrices } from '../lib/api/batchPrice/batchPrice.service';
import { batchPriceSchema } from '../lib/api/batchPrice/batchPrice.schema';
import { AppError } from '../utils/errors';

interface BatchPriceRequest extends FastifyRequest {
  body: {
    pairs: string[];
    currency?: string;
  };
}

export async function batchPriceController(
  req: BatchPriceRequest,
  reply: FastifyReply
) {
  try {
    const validatedInput = batchPriceSchema.parse(req.body);
    const { results, errors } = await getBatchPrices(validatedInput);

    if (Object.keys(errors).length > 0) {
      // Partial failure
      return reply.code(207).send({
        message: 'Partial success: some prices could not be fetched.',
        data: results,
        errors: errors,
      });
    } else {
      // All successful
      return reply.code(200).send({
        message: 'Successfully fetched all prices.',
        data: results,
      });
    }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    if (error instanceof ZodError) {
      return reply
        .code(400)
        .send({ message: 'Validation error', errors: error.errors });
    }
    if (error instanceof Error) {
      return reply
        .code(500)
        .send({ message: 'Internal server error', error: error.message });
    }
    return reply
      .code(500)
      .send({ message: 'Internal server error', error: String(error) });
  }
}
