import { prisma } from '../../../utils/prisma';
import { ProfileResponse } from './profile.schema';

export class ProfileService {
  static async getUserProfile(userId: string): Promise<ProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            alerts: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
