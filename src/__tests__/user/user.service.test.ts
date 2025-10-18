import { describe, it, expect } from 'vitest';
import { createMockUser } from '../../lib/api/user/user.service';
import { UserData } from '../../lib/api/user/user.schema';

describe('createMockUser', () => {
  it('should return a UserData object with the correct shape and types', () => {
    const mockUser: UserData = createMockUser();

    expect(mockUser).toBeDefined();
    expect(typeof mockUser.balance).toBe('string');
    expect(typeof mockUser.picture).toBe('string');
    expect(typeof mockUser.age).toBe('number');
    expect(typeof mockUser.name).toBe('string');
    expect(typeof mockUser.gender).toBe('string');
    expect(typeof mockUser.company).toBe('string');
    expect(typeof mockUser.email).toBe('string');

    // Optionally, check for specific values if they are fixed in the mock
    expect(mockUser.balance).toBe('$3,277.32');
    expect(mockUser.email).toBe('leonorcross@gronk.com');
  });
});
