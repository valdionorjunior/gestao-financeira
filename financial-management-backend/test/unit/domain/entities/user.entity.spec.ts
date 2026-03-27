import { User, UserRole, UserStatus } from '@domain/entities/user.entity';

function makeUser(overrides: Partial<User> = {}): User {
  const u = new User();
  u.id = 'user-uuid-1';
  u.email = 'joao@example.com';
  u.firstName = 'João';
  u.lastName = 'Silva';
  u.role = UserRole.TITULAR;
  u.status = UserStatus.ACTIVE;
  u.emailVerified = true;
  u.lgpdConsent = true;
  u.createdAt = new Date();
  u.updatedAt = new Date();
  return Object.assign(u, overrides);
}

describe('User entity', () => {
  describe('fullName getter', () => {
    it('should concatenate firstName and lastName', () => {
      const user = makeUser();
      expect(user.fullName).toBe('João Silva');
    });
  });

  describe('isActive()', () => {
    it('should return true for ACTIVE user without deletedAt', () => {
      const user = makeUser();
      expect(user.isActive()).toBe(true);
    });

    it('should return false for INACTIVE user', () => {
      const user = makeUser({ status: UserStatus.INACTIVE });
      expect(user.isActive()).toBe(false);
    });

    it('should return false for SUSPENDED user', () => {
      const user = makeUser({ status: UserStatus.SUSPENDED });
      expect(user.isActive()).toBe(false);
    });

    it('should return false when deletedAt is set (soft deleted)', () => {
      const user = makeUser({ deletedAt: new Date() });
      expect(user.isActive()).toBe(false);
    });

    it('should return false for PENDING_VERIFICATION user', () => {
      const user = makeUser({ status: UserStatus.PENDING });
      expect(user.isActive()).toBe(false);
    });
  });

  describe('canLogin()', () => {
    it('should return true for active user with verified email', () => {
      const user = makeUser({ emailVerified: true });
      expect(user.canLogin()).toBe(true);
    });

    it('should return false when user is inactive', () => {
      const user = makeUser({ status: UserStatus.SUSPENDED, emailVerified: true });
      expect(user.canLogin()).toBe(false);
    });

    it('should return false when email is not verified', () => {
      const user = makeUser({ emailVerified: false });
      expect(user.canLogin()).toBe(false);
    });

    it('should return false when both inactive and unverified', () => {
      const user = makeUser({ status: UserStatus.INACTIVE, emailVerified: false });
      expect(user.canLogin()).toBe(false);
    });
  });

  describe('UserRole enum', () => {
    it('should have ADMIN, TITULAR and MEMBRO values', () => {
      expect(UserRole.ADMIN).toBe('ADMIN');
      expect(UserRole.TITULAR).toBe('TITULAR');
      expect(UserRole.MEMBRO).toBe('MEMBRO_FAMILIAR');
    });
  });

  describe('UserStatus enum', () => {
    it('should have all expected status values', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.INACTIVE).toBe('INACTIVE');
      expect(UserStatus.PENDING).toBe('PENDING_VERIFICATION');
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED');
    });
  });
});
