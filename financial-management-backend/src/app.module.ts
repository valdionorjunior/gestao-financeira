import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { AuthModule }          from './infrastructure/modules/auth.module';
import { AccountsModule }       from './infrastructure/modules/accounts.module';
import { CategoriesModule }     from './infrastructure/modules/categories.module';
import { TransactionsModule }   from './infrastructure/modules/transactions.module';
import { BudgetsGoalsModule }   from './infrastructure/modules/budgets-goals.module';
import { ReportsModule }        from './infrastructure/modules/reports.module';
import { BankStatementsModule } from './infrastructure/modules/bank-statements.module';
import { AIModule }             from './infrastructure/modules/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/infrastructure/persistence/typeorm/entities/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: config.get<string>('app.nodeEnv') === 'development',
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttleTtl', 60),
            limit: config.get<number>('app.throttleLimit', 100),
          },
        ],
      }),
    }),
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsGoalsModule,
    ReportsModule,
    BankStatementsModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
