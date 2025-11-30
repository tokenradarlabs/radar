import { describe, it, expect } from 'vitest';
import { z, priceTokenIdSchema, formatZodError, REQUIRED_ERROR, MIN_LENGTH_ERROR, INVALID_TYPE_ERROR } from '../../utils/validation';
import { ZodIssueCode } from 'zod';


describe('priceTokenIdSchema', () => {
  it('should accept valid token IDs', () => {
    expect(priceTokenIdSchema.parse({ tokenId: 'btc' })).toEqual({
      tokenId: 'btc',
    });
    expect(priceTokenIdSchema.parse({ tokenId: 'eth' })).toEqual({
      tokenId: 'eth',
    });
    expect(
      priceTokenIdSchema.parse({ tokenId: 'scout-protocol-token' })
    ).toEqual({ tokenId: 'scout-protocol-token' });
  });

  it('should reject invalid token IDs', () => {
    expect(() => priceTokenIdSchema.parse({ tokenId: 'invalid' })).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: '' })).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: ' ' })).toThrow(); // Empty string after trim
    expect(() => priceTokenIdSchema.parse({})).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: 123 })).toThrow();
  });

  it('should trim and lowercase token IDs before validation', () => {
    expect(priceTokenIdSchema.parse({ tokenId: '  BTC  ' })).toEqual({
      tokenId: 'btc',
    });
    expect(priceTokenIdSchema.parse({ tokenId: '  ETH  ' })).toEqual({
      tokenId: 'eth',
    });
  });

  describe('formatZodError', () => {
    it('should format a single field error correctly', () => {
      const schema = z.object({ name: z.string().min(1, 'Name is required') });
      const result = schema.safeParse({ name: '' });

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'name', message: 'Name is required', code: ZodIssueCode.too_small },
        ]);
      }
    });

    it('should format multiple field errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        age: z.number().min(18, 'Must be 18 or older'),
      });
      const result = schema.safeParse({ name: '', age: 10 });

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'name', message: 'Name is required', code: ZodIssueCode.too_small },
          { field: 'age', message: 'Must be 18 or older', code: ZodIssueCode.too_small },
        ]);
      }
    });

    it('should format a root-level error correctly without a field', () => {
      const schema = z.string();
      const result = schema.safeParse(123);

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { message: 'Expected string, received number', code: ZodIssueCode.invalid_type },
        ]);
      }
    });

    it('should handle nested object errors', () => {
      const nestedSchema = z.object({
        id: z.string().uuid('Invalid UUID'),
      });
      const schema = z.object({
        user: nestedSchema,
      });
      const result = schema.safeParse({ user: { id: 'not-a-uuid' } });

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'user.id', message: 'Invalid UUID', code: ZodIssueCode.invalid_string },
        ]);
      }
    });

    it('should format required_error', () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({});

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'name', message: REQUIRED_ERROR, code: ZodIssueCode.invalid_type },
        ]);
      }
    });

    it('should format invalid_type_error', () => {
      const schema = z.object({ age: z.number() });
      const result = schema.safeParse({ age: 'abc' });

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'age', message: INVALID_TYPE_ERROR, code: ZodIssueCode.invalid_type },
        ]);
      }
    });

    it('should format min_length_error', () => {
      const schema = z.object({ name: z.string().min(5, MIN_LENGTH_ERROR) });
      const result = schema.safeParse({ name: 'test' });

      if (!result.success) {
        const formattedErrors = formatZodError(result.error);
        expect(formattedErrors).toEqual([
          { field: 'name', message: MIN_LENGTH_ERROR, code: ZodIssueCode.too_small },
        ]);
      }
    });
  });
});
