import bcrypt from "bcrypt";

export const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function isPrismaError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error;
}

export function isDuplicateEmailError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2002';
}
