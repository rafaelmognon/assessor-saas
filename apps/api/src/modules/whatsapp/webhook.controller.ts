import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionAdapter } from './adapters/evolution.adapter';
import { WhatsAppService } from './whatsapp.service';

export const MENSAGENS_QUEUE = 'mensagens-recebidas';

@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly adapter: EvolutionAdapter,
    private readonly prisma: PrismaService,
    @InjectQueue(MENSAGENS_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Webhook global da Evolution.
   * Só aceita eventos da instância global do SaaS (ignora outros).
   */
  @Public()
  @HttpCode(200)
  @Post()
  async handle(@Body() payload: any) {
    try {
      const event = payload?.event;
      const instanceId = payload?.instance;

      this.logger.debug(`Webhook event=${event} instance=${instanceId}`);

      // Ignora tudo que não é da instância global
      if (instanceId !== WhatsAppService.GLOBAL_INSTANCE_ID) {
        return { ok: true, ignored: 'instance_nao_global' };
      }

      if (event === 'messages.upsert') {
        const msg = this.adapter.parseWebhook(payload);
        if (msg) {
          await this.queue.add('processar', msg, {
            removeOnComplete: 100,
            removeOnFail: 500,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          });
        }
        return { ok: true, queued: !!msg };
      }

      if (event === 'qrcode.updated') {
        const qr = payload?.data?.qrcode?.base64 ?? payload?.data?.base64;
        if (qr) {
          await this.prisma.whatsAppInstance.updateMany({
            where: { instanceId },
            data: { status: 'QR_CODE', qrCode: qr },
          });
          this.logger.log(`QR atualizado`);
        }
        return { ok: true };
      }

      if (event === 'connection.update') {
        const state = payload?.data?.state;
        if (state === 'open') {
          const wuid = payload?.data?.wuid ?? payload?.data?.instance?.wuid;
          let numero: string | undefined = wuid?.split('@')[0];
          if (numero && !numero.startsWith('+')) numero = `+${numero}`;
          await this.prisma.whatsAppInstance.updateMany({
            where: { instanceId },
            data: {
              status: 'CONNECTED',
              numero,
              qrCode: null,
              conectadoEm: new Date(),
            },
          });
          this.logger.log(`✅ instância conectada (${numero ?? '?'})`);
        } else if (state === 'close') {
          await this.prisma.whatsAppInstance.updateMany({
            where: { instanceId },
            data: { status: 'DISCONNECTED' },
          });
          this.logger.log(`❌ instância desconectada`);
        }
        return { ok: true };
      }

      return { ok: true, ignored: true };
    } catch (e: any) {
      this.logger.error(`Webhook error: ${e.message}`, e.stack);
      return { ok: false };
    }
  }
}
