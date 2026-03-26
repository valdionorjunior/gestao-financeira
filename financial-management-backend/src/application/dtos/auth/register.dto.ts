import {
  IsEmail, IsNotEmpty, IsString, MinLength, MaxLength,
  IsBoolean, IsOptional, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  lgpdConsent: boolean;
}
