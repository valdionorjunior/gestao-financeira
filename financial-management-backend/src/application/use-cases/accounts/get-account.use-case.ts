import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { EncryptionService } from '../../../infrastructure/services/encryption.service';

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAll(userId: string) {
    const accounts = await this.accountRepository.findAllByUserId(userId);
    return accounts.map(a => this.decryptSensitiveFields(a));
  }

  async findOne(id: string, userId: string) {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return this.decryptSensitiveFields(account);
  }

  private decryptSensitiveFields(account: any) {
    const result = { ...account };
    try {
      if (result.agency)        result.agency        = this.encryptionService.decrypt(result.agency);
      if (result.accountNumber) result.accountNumber = this.encryptionService.decrypt(result.accountNumber);
    } catch {
      // se não estiver criptografado (dados antigos), retorna como está
    }
    return result;
  }
}

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão para excluir esta conta');
    await this.accountRepository.softDelete(id);
  }
}
