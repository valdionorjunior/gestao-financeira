import {
  Injectable, ConflictException, BadRequestException, Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { UserRole, UserStatus } from '../../../domain/entities/user.entity';
import { RegisterDto } from '../../dtos/auth/register.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: RegisterDto) {
    if (!dto.lgpdConsent) {
      throw new BadRequestException('Consentimento LGPD é obrigatório');
    }

    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.save({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone,
      role: UserRole.TITULAR,
      status: UserStatus.ACTIVE,
      emailVerified: true, // simplificado: em produção enviar e-mail de verificação
      emailVerifiedAt: new Date(),
      lgpdConsent: true,
      lgpdConsentAt: new Date(),
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
