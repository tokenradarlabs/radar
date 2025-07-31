export type UserData = {
  id: string;
  email: string;
  createdAt: Date;
  token?: string; // Optional to maintain backward compatibility
}; 