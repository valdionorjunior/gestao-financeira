import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

// Bypass TLS verification for environments with corporate SSL inspection proxies.
// Controlled by OPENAI_DISABLE_TLS_VERIFY=true — never enable in production.
if (process.env.OPENAI_DISABLE_TLS_VERIFY === 'true' && process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[SECURITY] TLS certificate verification is DISABLED (OPENAI_DISABLE_TLS_VERIFY=true). Do NOT use in production.');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:5173', 'http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const prefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Gestão Financeira API')
      .setDescription('API completa de gestão financeira pessoal e familiar')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Gestão de usuários')
      .addTag('families', 'Gestão familiar')
      .addTag('accounts', 'Contas bancárias')
      .addTag('categories', 'Categorias e subcategorias')
      .addTag('transactions', 'Transações financeiras')
      .addTag('budgets', 'Orçamentos')
      .addTag('goals', 'Metas financeiras')
      .addTag('investments', 'Investimentos')
      .addTag('reports', 'Relatórios e dashboards')
      .addTag('ai', 'Módulo de inteligência artificial')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
