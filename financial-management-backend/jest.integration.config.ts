/**
 * Jest config para testes de integração.
 * Scope de cobertura: apenas use-cases de auth, accounts e transactions +
 * serviços de infraestrutura testados com dependências reais.
 */
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
  displayName: { name: 'integration', color: 'green' },
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage/integration',
  collectCoverageFrom: [
    'src/application/use-cases/auth/**/*.(t|j)s',
    'src/application/use-cases/accounts/**/*.(t|j)s',
    'src/application/use-cases/transactions/**/*.(t|j)s',
    'src/infrastructure/services/encryption.service.ts',
    'src/infrastructure/services/token-blacklist.service.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};

export default config;
