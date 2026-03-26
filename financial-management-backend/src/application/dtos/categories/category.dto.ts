import {
  IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../../../domain/entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({ example: 'utensils' })
  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: '#ea0606' })
  @IsOptional() @IsString() @MaxLength(7)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  familyId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(7)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Supermercado' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(7)
  color?: string;
}

export class UpdateSubcategoryDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(7)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
