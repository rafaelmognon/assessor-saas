import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Criptografia de campo (field-level encryption) com AES-256-GCM.
 *
 * Modo escolhido: GCM
 * - Authenticated encryption: detecta se o texto cifrado foi adulterado
 * - IV único por cifragem (96 bits random)
 * - Padrão OWASP para proteção de dados em repouso
 *
 * Formato do texto cifrado:
 *   base64(iv || authTag || ciphertext)
 *   - iv:        12 bytes
 *   - authTag:   16 bytes
 *   - ciphertext: N bytes
 *
 * Chave:
 *   FIELD_ENCRYPTION_KEY (base64, 32 bytes plain = 44 chars base64)
 *   Gerar com: openssl rand -base64 32
 *
 * IMPORTANTE — gestão da chave:
 *   Em produção, FIELD_ENCRYPTION_KEY deve viver em um secrets manager
 *   (Doppler, HashiCorp Vault, AWS Secrets Manager) — NÃO em arquivo .env
 *   do servidor de aplicação. Se atacante ganha acesso ao servidor E ao .env,
 *   a criptografia perde o valor. Separe-os.
 *
 *   Pra MVP: documentar no README que .env fica com permissão 600 e é
 *   feito backup da chave OFFLINE (anotação manual em lugar físico seguro).
 *
 * Rotação de chave (futuro):
 *   Prefixo "v1:" no ciphertext permite algoritmos/chaves novas no futuro
 *   sem quebrar dados antigos.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_VERSION = 'v1';

@Injectable()
export class FieldCryptoService {
  private readonly logger = new Logger(FieldCryptoService.name);
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const raw = config.get<string>('FIELD_ENCRYPTION_KEY');
    if (!raw) {
      this.logger.error(
        '⚠️  FIELD_ENCRYPTION_KEY ausente — dados sensíveis NÃO serão criptografados!',
      );
      this.key = null;
      return;
    }
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length !== 32) {
      throw new Error(
        `FIELD_ENCRYPTION_KEY deve ter 32 bytes em base64 (use: openssl rand -base64 32). Atual: ${decoded.length} bytes`,
      );
    }
    this.key = decoded;
  }

  /**
   * Criptografa texto em claro.
   * Se a chave não estiver configurada, retorna o próprio texto (modo dev).
   * Usa prefixo "v1:" no retorno pra permitir rotação futura.
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    if (!this.key) return plaintext;

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, ciphertext]);
    return `${KEY_VERSION}:${combined.toString('base64')}`;
  }

  /**
   * Descriptografa texto cifrado.
   * Se não começar com versão conhecida, retorna o próprio valor (texto plano, legado).
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;
    if (!this.key) return ciphertext;

    // Legacy / plaintext: não tem prefixo de versão
    if (!ciphertext.startsWith(`${KEY_VERSION}:`)) {
      return ciphertext;
    }

    try {
      const combined = Buffer.from(ciphertext.slice(KEY_VERSION.length + 1), 'base64');
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const payload = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(payload),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    } catch (e: any) {
      // Falha de descriptografia = chave trocada OU campo corrompido
      this.logger.error(`Falha ao descriptografar: ${e.message}`);
      return '[dados criptografados com chave antiga]';
    }
  }

  /**
   * Verifica se um valor está criptografado.
   */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(`${KEY_VERSION}:`);
  }

  /**
   * Criptografa valor opcional (pra campos nullable do Prisma).
   */
  encryptOptional(value: string | null | undefined): string | null {
    if (!value) return null;
    return this.encrypt(value);
  }

  decryptOptional(value: string | null | undefined): string | null {
    if (!value) return null;
    return this.decrypt(value);
  }
}
