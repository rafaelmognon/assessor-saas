import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // Signup
  // ─────────────────────────────────────────────
  async signup(dto: SignupDto, meta: { ip?: string; userAgent?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);

    // Trial de 14 dias
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Normaliza WhatsApp pra E.164
    let whatsapp = dto.whatsapp.replace(/\D/g, '');
    if (!whatsapp.startsWith('55') && whatsapp.length <= 11) {
      whatsapp = '55' + whatsapp; // assume BR se vier sem DDI
    }
    whatsapp = '+' + whatsapp;

    // Confere se já existe um user com esse whatsapp
    const whatsappExists = await this.prisma.user.findFirst({
      where: { whatsapp, deletedAt: null },
    });
    if (whatsappExists) {
      throw new ConflictException('Este WhatsApp já está cadastrado em outra conta');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        nome: dto.nome.trim(),
        passwordHash,
        whatsapp,
        trialEndsAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: { event: 'signup' },
      },
    });

    return this.issueTokens(user.id, user.email, meta);
  }

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────
  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      // mensagem genérica pra não vazar quais e-mails existem
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(dto.senha, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    if (user.deletedAt) {
      throw new UnauthorizedException('Conta desativada');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { ultimoLoginEm: new Date(), ultimoLoginIp: meta.ip },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return this.issueTokens(user.id, user.email, meta);
  }

  // ─────────────────────────────────────────────
  // Refresh token (com rotation)
  // ─────────────────────────────────────────────
  async refresh(refreshToken: string, meta: { ip?: string; userAgent?: string }) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Revoga o antigo (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user.id, stored.user.email, meta);
  }

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────
  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(
    userId: string,
    email: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    // Refresh token: 32 bytes random (não JWT — opaque token)
    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const expiresInDays = 7;

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
