import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { formatZodError } from '../utils/validation';

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  headers?: AnyZodObject;
}

export const validationMiddleware = (schemas: ValidationSchemas) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.headers) {
        await schemas.headers.parseAsync(req.headers);
      }
      if (schemas.query) {
        await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      next(error);
    }
  };
