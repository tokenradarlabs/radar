import { prisma } from '../../../utils/prisma';
import { generateToken } from '../../../utils/auth';
import { verifyPassword } from '../common/utils';
import { LoginRequest, LoginResponse } from './login.schema';

export class LoginService {
  static async loginUser(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      const timestamp = new Date().toISOString();
      throw new Error(`User Does Not Exist (${timestamp})`);
    }

    const isValidPassword = await verifyPassword(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ id: user.id, email: user.email });

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      token: token,
    };
  }
}
