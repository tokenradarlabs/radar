import { prisma } from '../../../utils/prisma';
import { hashPassword, isDuplicateEmailError } from '../common/utils';
import { RegisterRequest, RegisterResponse } from './register.schema';

export class RegisterService {
  static async registerUser(data: RegisterRequest): Promise<RegisterResponse> {
    const hashedPassword = await hashPassword(data.password);

    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }
}
