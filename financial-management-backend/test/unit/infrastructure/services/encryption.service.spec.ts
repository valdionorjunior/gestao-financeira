import { EncryptionService } from '@infrastructure/services/encryption.service';
import { ConfigService } from '@nestjs/config';

function makeService(key = 'my-test-encryption-key-32chars!!') {
  const config = { get: jest.fn().mockReturnValue(key) } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = makeService();
  });

  describe('encrypt() / decrypt()', () => {
    it('should encrypt and decrypt a string successfully', () => {
      const original = 'conta-1234-agencia-5678';
      const encrypted = service.encrypt(original);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext each time (random IV)', () => {
      const text = 'same-text';
      const enc1 = service.encrypt(text);
      const enc2 = service.encrypt(text);
      expect(enc1).not.toBe(enc2);
    });

    it('should result in format iv:authTag:ciphertext (two colons)', () => {
      const encrypted = service.encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes hex
      expect(parts[1]).toHaveLength(32); // 16 bytes hex auth tag
    });

    it('should encrypt CPF correctly', () => {
      const cpf = '123.456.789-00';
      const encrypted = service.encrypt(cpf);
      expect(encrypted).not.toBe(cpf);
      expect(service.decrypt(encrypted)).toBe(cpf);
    });

    it('should encrypt bank account number with special chars', () => {
      const accNumber = '12345-6';
      const encrypted = service.encrypt(accNumber);
      expect(service.decrypt(encrypted)).toBe(accNumber);
    });

    it('should encrypt unicode strings', () => {
      const text = 'Conta Poupança Ã ç ü';
      const encrypted = service.encrypt(text);
      expect(service.decrypt(encrypted)).toBe(text);
    });

    it('should encrypt empty string', () => {
      const encrypted = service.encrypt('');
      expect(service.decrypt(encrypted)).toBe('');
    });
  });

  describe('key derivation', () => {
    it('should use default key when config returns null/undefined', () => {
      const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
      const svc = new EncryptionService(config);
      const text = 'test-default-key';
      const enc = svc.encrypt(text);
      expect(svc.decrypt(enc)).toBe(text);
    });

    it('should produce different ciphertext with different keys', () => {
      const svc1 = makeService('key-one-32-chars-padded-00000000');
      const svc2 = makeService('key-two-32-chars-padded-00000000');
      const encrypted1 = svc1.encrypt('fixed-text');
      expect(() => svc2.decrypt(encrypted1)).toThrow();
    });
  });
});
