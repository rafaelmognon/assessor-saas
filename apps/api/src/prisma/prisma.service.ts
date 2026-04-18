import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Define o tenant ativo para a sessão atual do banco.
   * Usado pelo TenantMiddleware antes de cada query — ativa as policies RLS.
   */
  async setTenant(userId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SET app.current_user_id = '${userId.replace(/'/g, "''")}'`,
    );
  }
}
