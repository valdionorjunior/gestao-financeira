import type { Config } from 'jest';

/** Configurações compartilhadas entre todos os projects */
const shared = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
} satisfies Partial<Config>;

/** Exclusões comuns a todos os projetos */
const commonExclusions = [
  '!src/main.ts',
  '!src/**/*.module.ts',
  '!src/app.module.ts',
  '!src/app.controller.ts',
  '!src/app.service.ts',
  '!src/**/*.spec.ts',
  '!src/**/__tests__/**',
  '!src/infrastructure/persistence/**',
  '!src/infrastructure/repositories/**',
  '!src/presentation/interceptors/**',
  '!src/presentation/guards/jwt-refresh.strategy.ts',
  '!src/config/**',
];

const config: Config = {
  ...shared,

  // Cobertura global — coleta de todos os projetos juntos
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.(t|j)s', ...commonExclusions],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Suítes separadas por tipo com escopo de cobertura próprio
  projects: [
    {
      ...shared,
      displayName: { name: 'unit', color: 'blue' },
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      // Unit: mede toda a camada de domínio + aplicação + infra
      collectCoverageFrom: ['src/**/*.(t|j)s', ...commonExclusions],
    },
    {
      ...shared,
      displayName: { name: 'integration', color: 'green' },
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      // Integration: mede apenas os use-cases testados com serviços reais (bcrypt, JWT, encryption)
      collectCoverageFrom: [
        'src/application/use-cases/auth/**/*.(t|j)s',
        'src/application/use-cases/accounts/**/*.(t|j)s',
        'src/application/use-cases/transactions/**/*.(t|j)s',
        'src/infrastructure/services/encryption.service.ts',
        'src/infrastructure/services/token-blacklist.service.ts',
        '!src/**/*.spec.ts',
      ],
    },
    {
      ...shared,
      displayName: { name: 'contract', color: 'yellow' },
      testMatch: ['<rootDir>/test/contract/**/*.spec.ts'],
      // Contract: mede toda a camada de apresentação (controllers + DTOs + filters + guards)
      collectCoverageFrom: [
        'src/presentation/controllers/**/*.(t|j)s',
        'src/presentation/filters/**/*.(t|j)s',
        'src/presentation/guards/jwt-auth.guard.ts',
        'src/presentation/guards/roles.guard.ts',
        'src/presentation/decorators/**/*.(t|j)s',
        'src/application/dtos/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/presentation/guards/jwt-refresh.strategy.ts',
      ],
    },
    {
      ...shared,
      displayName: { name: 'e2e', color: 'magenta' },
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      // E2E: mede os controllers + filtros testados nos fluxos end-to-end
      collectCoverageFrom: [
        'src/presentation/controllers/auth.controller.ts',
        'src/presentation/controllers/account.controller.ts',
        'src/presentation/controllers/transaction.controller.ts',
        'src/presentation/filters/**/*.(t|j)s',
        'src/presentation/decorators/**/*.(t|j)s',
        '!src/**/*.spec.ts',
      ],
    },
  ],
};

export default config;
