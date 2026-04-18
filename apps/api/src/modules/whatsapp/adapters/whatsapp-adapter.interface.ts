/**
 * Interface unificada de provedores WhatsApp.
 *
 * Implementações:
 * - EvolutionAdapter (Sprint 1.6 — Baileys self-hosted)
 * - MetaCloudAdapter (futuro — Meta Cloud API oficial)
 * - ZApiAdapter (futuro — BSP brasileiro)
 *
 * Trocar de provedor = mudar WHATSAPP_PROVIDER no .env.
 */

export interface CreateInstanceResult {
  instanceId: string;
  qrcode?: string; // dataURL base64
  status: 'PENDING' | 'QR_CODE' | 'CONNECTED';
}

export interface InstanceStatus {
  status: 'PENDING' | 'QR_CODE' | 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  qrcode?: string;
  numero?: string; // E.164 quando conectado
}

export interface SendTextOptions {
  to: string; // E.164 ou JID
  text: string;
}

export interface IncomingMessage {
  externalId: string;        // ID na plataforma (pra dedup)
  instanceId: string;
  from: string;              // E.164
  type: 'TEXTO' | 'AUDIO' | 'IMAGEM' | 'DOCUMENTO';
  text?: string;
  mediaUrl?: string;         // URL pra baixar áudio/imagem
  mediaMimeType?: string;
  timestamp: Date;
}

export interface WhatsAppAdapter {
  /** Cria nova instância e retorna QR code pra escanear */
  createInstance(instanceId: string): Promise<CreateInstanceResult>;

  /** Consulta status atual */
  getStatus(instanceId: string): Promise<InstanceStatus>;

  /** Desconecta e remove instância */
  deleteInstance(instanceId: string): Promise<void>;

  /** Envia mensagem de texto */
  sendText(instanceId: string, opts: SendTextOptions): Promise<void>;

  /** Baixa mídia (áudio/imagem) e retorna buffer */
  downloadMedia(url: string): Promise<Buffer>;

  /**
   * Parser de webhook payload pra IncomingMessage.
   * Cada provedor formata diferente — esse método normaliza.
   * Retorna null se evento não for relevante.
   */
  parseWebhook(payload: any): IncomingMessage | null;
}
