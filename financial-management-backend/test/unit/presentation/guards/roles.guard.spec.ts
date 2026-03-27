import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { ROLES_KEY } from '@presentation/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';

function makeExecutionContext(user: any, handler?: any, cls?: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => handler ?? function targetHandler() {},
    getClass: () => cls ?? class TargetClass {},
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeExecutionContext({ role: UserRole.MEMBRO });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when required roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeExecutionContext({ role: UserRole.MEMBRO });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.TITULAR]);
    const ctx = makeExecutionContext({ role: UserRole.TITULAR });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN access when ADMIN role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeExecutionContext({ role: UserRole.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeExecutionContext({ role: UserRole.MEMBRO });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException (Permissão insuficiente) when role mismatch', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.TITULAR]);
    const ctx = makeExecutionContext({ role: UserRole.MEMBRO });
    expect(() => guard.canActivate(ctx)).toThrow('Permissão insuficiente');
  });

  it('should throw ForbiddenException when user is not set in request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeExecutionContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException (Acesso negado) when user is null', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeExecutionContext(null);
    expect(() => guard.canActivate(ctx)).toThrow('Acesso negado');
  });

  it('should allow access when multiple roles include user role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.TITULAR]);
    const ctx = makeExecutionContext({ role: UserRole.TITULAR });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
