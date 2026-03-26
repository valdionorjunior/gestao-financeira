import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
