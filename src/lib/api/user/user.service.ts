import { UserData } from './user.schema';

export class UserService {
  static async getUserData(): Promise<UserData> {
    // This is mock data as per the original controller
    return {
      balance: "$3,277.32",
      picture: "http://placehold.it/32x32",
      age: 30,
      name: "Leonor Cross",
      gender: "female",
      company: "GRONK",
      email: "leonorcross@gronk.com",
    };
  }
}
