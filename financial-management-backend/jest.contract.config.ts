/**
 * Jest config para testes de contrato.
 * Scope de cobertura: apenas camada de apresentação — controllers, DTOs,
 * filters, guards e decorators.
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
  displayName: { name: 'contract', color: 'yellow' },
  testMatch: ['<rootDir>/test/contract/**/*.spec.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage/contract',
  collectCoverageFrom: [
    'src/presentation/controllers/**/*.(t|j)s',
    'src/presentation/filters/**/*.(t|j)s',
    'src/presentation/guards/jwt-auth.guard.ts',
    'src/presentation/guards/roles.guard.ts',
    'src/presentation/decorators/**/*.(t|j)s',
    'src/application/dtos/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/presentation/guards/jwt-refresh.strategy.ts',
    '!src/presentation/guards/jwt.strategy.ts',
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};

export default config;
