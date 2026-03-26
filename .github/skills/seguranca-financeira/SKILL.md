---
name: seguranca-financeira
description: "Implementação de segurança e conformidade em sistemas financeiros. Use when: configurar JWT e OAuth2, implementar RBAC, criptografia AES-256, auditoria de transações, conformidade LGPD, rate limiting, validação de entrada, middleware de segurança, proteção contra ataques, logs de auditoria."
---

# Skill: Segurança e Conformidade Financeira

## Quando Usar

Esta skill se aplica quando você está:
- Implementando autenticação JWT com refresh token
- Configurando autorização RBAC para operações financeiras
- Aplicando criptografia AES-256 para dados sensíveis
- Criando logs de auditoria para operações críticas
- Implementando conformidade LGPD/GDPR
- Configurando rate limiting e proteção contra ataques
- Validando entrada de dados financeiros
- Criando middleware de segurança
- Implementando logout seguro e revogação de tokens

## Autenticação JWT Robusta

### Estratégia JWT com NestJS

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true // Permite acesso ao request
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<UserPayload> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    
    // Verificar se token está na blacklist
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }
    
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      familyIds: user.familyIds
    };
  }
}
```

### Refresh Token com Rotation

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService
  ) {}

  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      familyIds: user.familyIds
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') // 15 mins
    });

    const refreshToken = await this.refreshTokenService.create(user.id, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') // 7 days
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(oldRefreshToken: string): Promise<TokenPair> {
    // Token theft detection
    const refreshTokenRecord = await this.refreshTokenService.findByToken(oldRefreshToken);
    
    if (!refreshTokenRecord || !refreshTokenRecord.isValid) {
      // Possível reutilização de token - invalidar toda a família
      await this.refreshTokenService.invalidateTokenFamily(refreshTokenRecord?.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.userService.findById(refreshTokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Invalidar token atual e gerar novo par
    await this.refreshTokenService.invalidate(oldRefreshToken);
    return this.generateTokens(user);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    // Adicionar access token à blacklist
    await this.tokenBlacklistService.blacklist(accessToken);
    
    // Invalidar refresh token se fornecido
    if (refreshToken) {
      await this.refreshTokenService.invalidate(refreshToken);
    }
  }
}
```

## RBAC (Role-Based Access Control)

### Guard de Autorização Financeira

```typescript
@Injectable()
export class FinancialRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const resourceType = this.extractResourceType(request.url);
    
    return this.checkFinancialPermission(user, method, resourceType, request.params);
  }
  
  private checkFinancialPermission(
    user: UserPayload,
    method: string,
    resourceType: string,
    params: any
  ): boolean {
    // ADMIN pode tudo
    if (user.roles.includes('ADMIN')) {
      return true;
    }
    
    // TITULAR pode gerenciar recursos da própria família
    if (user.roles.includes('TITULAR')) {
      return this.userOwnsOrCanAccess(user, params, resourceType);
    }
    
    // MEMBRO_FAMILIAR só pode ler recursos da família
    if (user.roles.includes('MEMBRO_FAMILIAR')) {
      return method === 'GET' && this.userBelongsToFamily(user, params);
    }
    
    return false;
  }
  
  private userOwnsOrCanAccess(
    user: UserPayload,
    params: any,
    resourceType: string
  ): boolean {
    // Verificar ownership direto (contas, transações do usuário)
    if (params.userId && params.userId !== user.userId) {
      return false;
    }
    
    // Verificar acesso familiar
    if (params.familyId && !user.familyIds.includes(params.familyId)) {
      return false;
    }
    
    return true;
  }
}
```

## Criptografia de Dados Sensíveis

### Service de Criptografia AES-256

```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;
  
  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get('ENCRYPTION_KEY');
    this.secretKey = crypto.scryptSync(key, 'salt', 32);
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, { iv });
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey, { iv });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Entity com campos criptografados
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  email: string;
  
  @Column({ name: 'encrypted_cpf' })
  private encryptedCpf: string;
  
  constructor(
    private readonly encryptionService: EncryptionService
  ) {}
  
  setCpf(cpf: string): void {
    this.encryptedCpf = this.encryptionService.encrypt(cpf);
  }
  
  getCpf(): string {
    return this.encryptedCpf ? this.encryptionService.decrypt(this.encryptedCpf) : '';
  }
}
```

## Auditoria Completa

### Interceptor de Auditoria

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params } = request;
    
    const auditData = {
      userId: user?.userId,
      action: `${method} ${url}`,
      entity: this.extractEntityFromUrl(url),
      entityId: params?.id,
      oldValue: null,
      newValue: method !== 'GET' ? body : null,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      timestamp: new Date()
    };
    
    return next.handle().pipe(
      tap(response => {
        // Log successful operations
        this.auditService.logOperation({
          ...auditData,
          success: true,
          responseData: this.shouldLogResponse(url) ? response : null
        });
      }),
      catchError(error => {
        // Log failed operations
        this.auditService.logOperation({
          ...auditData,
          success: false,
          error: error.message
        });
        throw error;
      })
    );
  }
  
  private shouldLogResponse(url: string): boolean {
    // Não logar respostas sensíveis (auth tokens, etc.)
    return !url.includes('/auth/');
  }
}
```

## Conformidade LGPD

### Controller de Conformidade

```typescript
@Controller('lgpd')
@UseGuards(JwtAuthGuard)
export class LGPDController {
  constructor(
    private readonly lgpdService: LGPDService,
    private readonly userService: UserService
  ) {}
  
  @Get('export')
  async exportUserData(@GetUser() user: UserPayload): Promise<UserDataExport> {
    return this.lgpdService.exportAllUserData(user.userId);
  }
  
  @Post('consent')
  async updateConsent(
    @GetUser() user: UserPayload,
    @Body() consentDto: ConsentUpdateDto
  ): Promise<void> {
    await this.lgpdService.updateConsent(user.userId, consentDto);
  }
  
  @Delete('account')
  async deleteAccount(
    @GetUser() user: UserPayload,
    @Body() confirmationDto: AccountDeletionDto
  ): Promise<void> {
    // Confirmar identidade
    const isValid = await this.userService.validatePassword(
      user.userId,
      confirmationDto.password
    );
    
    if (!isValid) {
      throw new BadRequestException('Invalid password confirmation');
    }
    
    // Anonimizar dados em vez de deletar (para manter integridade financeira)
    await this.lgpdService.anonymizeUserData(user.userId);
  }
}
```

## Rate Limiting e Proteção

### Rate Limiting Configurado

```typescript
@Injectable()
export class FinancialRateLimiter implements RateLimiterInterface {
  private limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Limites diferenciados por tipo de operação
      if (req.url.includes('/auth/login')) {
        return 5; // 5 tentativas de login por 15 min
      }
      if (req.url.includes('/transactions')) {
        return 100; // 100 transações por 15 min
      }
      return 200; // Limite padrão
    },
    message: {
      error: 'Too many requests',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}
```

## Validação de Entrada Robusta

### DTOs com Validação de Segurança

```typescript
export class CreateTransactionDto {
  @IsNotEmpty()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9\s\-\.\,]+$/, {
    message: 'Description contains invalid characters'
  })
  description: string;
  
  @IsPositive()
  @Max(999999999.99)
  @IsDecimal({ decimal_digits: '0,2' })
  amount: number;
  
  @IsUUID()
  accountId: string;
  
  @IsOptional()
  @IsUUID()
  categoryId?: string;
  
  @IsDateString()
  @Validate(IsNotFutureDate)
  date: string;
}

// Validador customizado
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDate implements ValidatorConstraintInterface {
  validate(date: string): boolean {
    return new Date(date) <= new Date();
  }
  
  defaultMessage(): string {
    return 'Transaction date cannot be in the future';
  }
}
```

## Checklist de Segurança

- [ ] JWT com expiração curta (15 min) e refresh token rotation
- [ ] Blacklist de tokens implementada com Redis
- [ ] RBAC granular para operações financeiras
- [ ] Campos sensíveis criptografados com AES-256
- [ ] Auditoria completa de operações críticas
- [ ] Rate limiting diferenciado por tipo de operação
- [ ] Validação rigorosa de entrada em todas as camadas
- [ ] Conformidade LGPD com export e anonymização
- [ ] HTTPS obrigatório em produção
- [ ] Headers de segurança (Helmet.js) configurados
- [ ] Logs estruturados sem dados sensíveis
- [ ] Monitoramento de tentativas de acesso suspeitas

## Anti-Patterns de Segurança a Evitar

- **Tokens sem expiração**: Todo JWT deve ter TTL curto
- **Dados sensíveis não criptografados**: CPF, contas bancárias devem ser criptografados
- **Logs com dados pessoais**: Nunca logar senhas, tokens ou dados pessoais
- **Autorização só no frontend**: Backend deve sempre validar permissões
- **Rate limiting genérico**: Operações financeiras precisam limites específicos
- **Hard-coded secrets**: Usar variáveis de ambiente para todas as chaves
- **SQL Injection**: Sempre usar prepared statements ou ORM
- **Missing audit trail**: Operações financeiras devem ser sempre auditadas