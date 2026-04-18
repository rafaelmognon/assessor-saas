import { TopNav } from '@/components/topnav';
import { api } from '@/lib/api';
import { WhatsAppClient } from './whatsapp-client';

export const dynamic = 'force-dynamic';

interface Status {
  status: 'NAO_CONFIGURADO' | 'PENDING' | 'QR_CODE' | 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  numero?: string;
  qrcode?: string;
  conectadoEm?: string | null;
}

interface Mensagem {
  id: string;
  direcao: 'ENTRADA' | 'SAIDA';
  tipo: string;
  conteudo: string;
  transcricao: string | null;
  intent: string | null;
  createdAt: string;
}

export default async function WhatsAppPage() {
  // Status inicial — pode falhar se Evolution não responder
  let status: Status = { status: 'NAO_CONFIGURADO' };
  try {
    status = await api<Status>('/me/whatsapp/status');
  } catch {
    // mantém NAO_CONFIGURADO
  }

  return (
    <>
      <TopNav active="/whatsapp" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <WhatsAppClient initialStatus={status} />
      </main>
    </>
  );
}
