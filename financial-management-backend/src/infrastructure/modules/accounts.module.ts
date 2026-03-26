import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity }          from '../persistence/typeorm/entities/account.entity';
import { AccountRepository }      from '../repositories/account.repository';
import { ACCOUNT_REPOSITORY }     from '../../domain/repositories/account.repository.interface';
import { EncryptionService }       from '../services/encryption.service';
import { CreateAccountUseCase }   from '../../application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase }   from '../../application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '../../application/use-cases/accounts/get-account.use-case';
import { AccountController }      from '../../presentation/controllers/account.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: AccountRepository },
    EncryptionService,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    GetAccountUseCase,
    DeleteAccountUseCase,
  ],
  controllers: [AccountController],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountsModule {}
