import { IUserProfile } from '../../types/user';

export const createMockUser = (): IUserProfile => {
  return {
    balance: '$3,277.32',
    picture: 'http://placehold.it/32x32',
    age: 36,
    name: 'Leonor Cross',
    gender: 'female',
    company: 'GRONK',
    email: 'leonorcross@gronk.com',
  };
};

export class UserService {
  static async getUserData(): Promise<IUserProfile> {
    // This is mock data as per the original controller
    return createMockUser();
  }
}
