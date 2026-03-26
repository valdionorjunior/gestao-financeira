import {
  Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserUseCase }  from '../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase }     from '../../application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase }  from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase }    from '../../application/use-cases/auth/logout-user.use-case';
import { RegisterDto }          from '../../application/dtos/auth/register.dto';
import { LoginDto }             from '../../application/dtos/auth/login.dto';
import { RefreshTokenDto }      from '../../application/dtos/auth/refresh-token.dto';
import { JwtAuthGuard }         from '../guards/jwt-auth.guard';
import { CurrentUser }          from '../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase:  RegisterUserUseCase,
    private readonly loginUseCase:     LoginUserUseCase,
    private readonly refreshUseCase:   RefreshTokenUseCase,
    private readonly logoutUseCase:    LogoutUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastro de novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const user = await this.registerUseCase.execute(dto);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    const tokens = await this.loginUseCase.generateTokenPair(
      user.id, user.email, user.role, ipAddress, userAgent,
    );
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.loginUseCase.execute(dto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token via refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.refreshUseCase.execute(dto.refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — invalida access token e refresh tokens' })
  @ApiResponse({ status: 204, description: 'Logout realizado' })
  async logout(
    @Req() req: Request,
    @Body() body: Partial<RefreshTokenDto>,
    @CurrentUser() user: any,
  ) {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.replace('Bearer ', '');
    await this.logoutUseCase.execute(accessToken, body.refreshToken, user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  async me(@CurrentUser() user: any) {
    return user;
  }
}
