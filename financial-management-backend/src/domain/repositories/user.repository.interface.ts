import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  save(user: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
