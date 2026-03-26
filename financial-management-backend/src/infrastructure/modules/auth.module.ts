import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity }         from '../../infrastructure/persistence/typeorm/entities/user.entity';
import { RefreshTokenEntity } from '../../infrastructure/persistence/typeorm/entities/refresh-token.entity';

import { UserRepository }         from '../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository';
import { TokenBlacklistService }  from '../../infrastructure/services/token-blacklist.service';
import { EncryptionService }      from '../../infrastructure/services/encryption.service';

import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase }    from '../../application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase }   from '../../application/use-cases/auth/logout-user.use-case';

import { JwtStrategy }        from '../../presentation/guards/jwt.strategy';
import { JwtRefreshStrategy } from '../../presentation/guards/jwt-refresh.strategy';
import { AuthController }     from '../../presentation/controllers/auth.controller';

import { USER_REPOSITORY }          from '../../domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository.interface';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get('jwt.accessExpiresIn') as any },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [
    // Repository bindings
    { provide: USER_REPOSITORY,          useClass: UserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
    // Infrastructure services
    TokenBlacklistService,
    EncryptionService,
    // Use cases
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUserUseCase,
    // Passport strategies
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    USER_REPOSITORY,
    TokenBlacklistService,
    EncryptionService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
