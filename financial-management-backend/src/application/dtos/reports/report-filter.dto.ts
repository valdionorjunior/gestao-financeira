import { IsOptional, IsDateString, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFilterDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class MonthlyReportDto {
  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ example: 1, description: 'Mês (1-12)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
