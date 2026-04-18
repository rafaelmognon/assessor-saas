import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EvolutionAdapter } from './adapters/evolution.adapter';
import { MensagensProcessor } from './mensagens.processor';
import { WebhookController, MENSAGENS_QUEUE } from './webhook.controller';
import { AdminWhatsAppController, ClientWhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get<string>('REDIS_URL', 'redis://localhost:6379'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
          },
        };
      },
    }),
    BullModule.registerQueue({ name: MENSAGENS_QUEUE }),
  ],
  controllers: [AdminWhatsAppController, ClientWhatsAppController, WebhookController],
  providers: [WhatsAppService, EvolutionAdapter, MensagensProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
