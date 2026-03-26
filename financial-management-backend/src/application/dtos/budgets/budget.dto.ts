import {
  IsEnum, IsUUID, IsNumber, IsPositive, IsOptional, IsBoolean, IsString,
  IsDateString, Min, Max, Matches, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod } from '../../../domain/entities/budget-goal.entity';

export class CreateBudgetDto {
  @ApiPropertyOptional({ description: 'Nome descritivo do orçamento (auto-gerado se omitido)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  familyId?: string;

  @ApiProperty({ enum: BudgetPeriod })
  @IsEnum(BudgetPeriod)
  period!: BudgetPeriod;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: 80, description: 'Percentual para alerta (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
