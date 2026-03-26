export enum UserRole   { ADMIN = 'ADMIN', TITULAR = 'TITULAR', MEMBRO = 'MEMBRO_FAMILIAR' }
export enum UserStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', PENDING = 'PENDING_VERIFICATION', SUSPENDED = 'SUSPENDED' }

export interface IUser {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lgpdConsent: boolean;
  lgpdConsentAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class User implements IUser {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lgpdConsent: boolean;
  lgpdConsentAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.deletedAt;
  }

  canLogin(): boolean {
    return this.isActive() && this.emailVerified;
  }
}
