import {
  Injectable, NotFoundException, ForbiddenException, Inject, ConflictException,
} from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { EncryptionService } from '../../../infrastructure/services/encryption.service';
import { UpdateAccountDto } from '../../dtos/accounts/update-account.dto';

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(id: string, dto: UpdateAccountDto, userId: string) {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão para editar esta conta');

    if (dto.name && dto.name !== account.name) {
      const nameExists = await this.accountRepository.existsByNameAndUser(dto.name, userId, id);
      if (nameExists) throw new ConflictException(`Conta "${dto.name}" já existe`);
    }

    const updateData: any = { ...dto };
    if (dto.agency)        updateData.agency        = this.encryptionService.encrypt(dto.agency);
    if (dto.accountNumber) updateData.accountNumber = this.encryptionService.encrypt(dto.accountNumber);
    delete updateData.initialBalance;

    return this.accountRepository.update(id, updateData);
  }
}
