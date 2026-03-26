import {
  IsEnum, IsNotEmpty, IsString, IsOptional, IsNumber,
  IsBoolean, MaxLength, Min, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../../../domain/entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'Conta Corrente Nubank' })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 'Nubank' })
  @IsOptional() @IsString() @MaxLength(150)
  bankName?: string;

  @ApiPropertyOptional({ example: '260' })
  @IsOptional() @IsString() @MaxLength(10)
  bankCode?: string;

  @ApiPropertyOptional({ example: '0001' })
  @IsOptional() @IsString() @MaxLength(10)
  agency?: string;

  @ApiPropertyOptional({ example: '12345-6' })
  @IsOptional() @IsString() @MaxLength(20)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 1000.00 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 })
  initialBalance?: number;

  @ApiPropertyOptional({ example: 5000.00, description: 'Apenas para cartão de crédito' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: '#17c1e8' })
  @IsOptional() @IsString() @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ example: 'credit-card' })
  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  includeInTotal?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  familyId?: string;
}
