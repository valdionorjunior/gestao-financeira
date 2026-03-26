import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { EncryptionService } from '../../../infrastructure/services/encryption.service';
import { CreateAccountDto } from '../../dtos/accounts/create-account.dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(dto: CreateAccountDto, userId: string) {
    const nameExists = await this.accountRepository.existsByNameAndUser(dto.name, userId);
    if (nameExists) {
      throw new ConflictException(`Conta "${dto.name}" já existe`);
    }

    const account = await this.accountRepository.save({
      userId,
      familyId: dto.familyId,
      name: dto.name,
      type: dto.type,
      bankName: dto.bankName,
      bankCode: dto.bankCode,
      agency: dto.agency ? this.encryptionService.encrypt(dto.agency) : undefined,
      accountNumber: dto.accountNumber ? this.encryptionService.encrypt(dto.accountNumber) : undefined,
      balance: dto.initialBalance ?? 0,
      creditLimit: dto.creditLimit,
      currency: dto.currency ?? 'BRL',
      color: dto.color ?? '#17c1e8',
      icon: dto.icon,
      includeInTotal: dto.includeInTotal ?? true,
      isActive: true,
    });

    return account;
  }
}
