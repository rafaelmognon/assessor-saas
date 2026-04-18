import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  CreateInstanceResult,
  IncomingMessage,
  InstanceStatus,
  SendTextOptions,
  WhatsAppAdapter,
} from './whatsapp-adapter.interface';

@Injectable()
export class EvolutionAdapter implements WhatsAppAdapter {
  private readonly logger = new Logger(EvolutionAdapter.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: config.get<string>('EVOLUTION_API_URL', 'http://evolution:8080'),
      headers: {
        apikey: config.get<string>('EVOLUTION_API_KEY', ''),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createInstance(instanceId: string): Promise<CreateInstanceResult> {
    try {
      const { data } = await this.http.post('/instance/create', {
        instanceName: instanceId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      // Evolution v2 retorna qrcode dentro de data.qrcode.base64
      const qrcode = data?.qrcode?.base64 ?? data?.instance?.qrcode?.base64;

      return {
        instanceId,
        qrcode,
        status: qrcode ? 'QR_CODE' : 'PENDING',
      };
    } catch (e: any) {
      this.logger.error(`Failed to create instance: ${e.response?.data?.message ?? e.message}`);
      throw e;
    }
  }

  async getStatus(instanceId: string): Promise<InstanceStatus> {
    try {
      const { data } = await this.http.get(`/instance/connectionState/${instanceId}`);
      const state = data?.instance?.state ?? data?.state;

      const map: Record<string, InstanceStatus['status']> = {
        open: 'CONNECTED',
        connecting: 'QR_CODE',
        close: 'DISCONNECTED',
      };

      const status = map[state] ?? 'DISCONNECTED';
      let qrcode: string | undefined;
      let numero: string | undefined;

      if (status === 'QR_CODE') {
        try {
          const qr = await this.http.get(`/instance/connect/${instanceId}`);
          qrcode = qr.data?.base64 ?? qr.data?.qrcode?.base64;
        } catch {
          /* ignore */
        }
      }

      if (status === 'CONNECTED') {
        try {
          const info = await this.http.get(`/instance/fetchInstances`, {
            params: { instanceName: instanceId },
          });
          const inst = Array.isArray(info.data) ? info.data[0] : info.data;
          numero = inst?.ownerJid?.split('@')[0] ?? inst?.number;
          if (numero && !numero.startsWith('+')) numero = `+${numero}`;
        } catch {
          /* ignore */
        }
      }

      return { status, qrcode, numero };
    } catch (e: any) {
      this.logger.error(`getStatus failed: ${e.response?.data?.message ?? e.message}`);
      return { status: 'DISCONNECTED' };
    }
  }

  async deleteInstance(instanceId: string): Promise<void> {
    try {
      await this.http.delete(`/instance/logout/${instanceId}`).catch(() => null);
      await this.http.delete(`/instance/delete/${instanceId}`);
    } catch (e: any) {
      this.logger.warn(`deleteInstance: ${e.message}`);
    }
  }

  async sendText(instanceId: string, opts: SendTextOptions): Promise<void> {
    const number = opts.to.replace(/\D/g, '');
    await this.http.post(`/message/sendText/${instanceId}`, {
      number,
      text: opts.text,
    });
  }

  async downloadMedia(url: string): Promise<Buffer> {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }

  parseWebhook(payload: any): IncomingMessage | null {
    // Evolution v2 envia: { event, instance, data: {...} }
    if (payload?.event !== 'messages.upsert') return null;

    const msg = payload?.data;
    if (!msg) return null;

    // Ignora mensagens enviadas POR NÓS
    if (msg.key?.fromMe) return null;

    const from = msg.key?.remoteJid?.split('@')[0];
    if (!from) return null;

    const externalId = msg.key?.id;
    const instanceId = payload.instance;
    const timestamp = new Date(((msg.messageTimestamp ?? Date.now() / 1000) as number) * 1000);

    // Tipo + conteúdo
    const m = msg.message ?? {};
    let type: IncomingMessage['type'] = 'TEXTO';
    let text: string | undefined;
    let mediaUrl: string | undefined;
    let mediaMimeType: string | undefined;

    if (m.conversation) {
      text = m.conversation;
    } else if (m.extendedTextMessage?.text) {
      text = m.extendedTextMessage.text;
    } else if (m.audioMessage) {
      type = 'AUDIO';
      mediaUrl = m.audioMessage.url;
      mediaMimeType = m.audioMessage.mimetype;
    } else if (m.imageMessage) {
      type = 'IMAGEM';
      text = m.imageMessage.caption;
      mediaUrl = m.imageMessage.url;
      mediaMimeType = m.imageMessage.mimetype;
    } else if (m.documentMessage) {
      type = 'DOCUMENTO';
      mediaUrl = m.documentMessage.url;
      mediaMimeType = m.documentMessage.mimetype;
    } else {
      return null; // tipo não suportado (sticker, location, etc)
    }

    return {
      externalId,
      instanceId,
      from: from.startsWith('+') ? from : `+${from}`,
      type,
      text,
      mediaUrl,
      mediaMimeType,
      timestamp,
    };
  }
}
