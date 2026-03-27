/**
 * Jest config para testes E2E.
 * Scope de cobertura: controllers de auth, accounts e transactions +
 * filters e decorators (camada HTTP testada ponta a ponta).
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
  displayName: { name: 'e2e', color: 'magenta' },
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage/e2e',
  collectCoverageFrom: [
    'src/presentation/controllers/auth.controller.ts',
    'src/presentation/controllers/account.controller.ts',
    'src/presentation/controllers/transaction.controller.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};

export default config;
