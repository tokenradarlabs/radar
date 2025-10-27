export interface IAuthUser {
  id: string;
  email: string;
  createdAt: Date;
  token?: string; // Optional to maintain backward compatibility
}

export interface IUserProfile {
  balance: string;
  picture: string;
  age: number;
  name: string;
  gender: string;
  company: string;
  email: string;
}
