import { TopNav } from '@/components/topnav';
import { api } from '@/lib/api';
import { AdminWhatsAppClient } from './admin-whatsapp-client';

export const dynamic = 'force-dynamic';

interface Status {
  status: 'NAO_CONFIGURADO' | 'PENDING' | 'QR_CODE' | 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  numero?: string;
  qrcode?: string;
  conectadoEm?: string | null;
}

export default async function AdminWhatsAppPage() {
  let status: Status = { status: 'NAO_CONFIGURADO' };
  try {
    status = await api<Status>('/admin/whatsapp/status');
  } catch {
    // usuário sem permissão ou Evolution offline
  }

  return (
    <>
      <TopNav active="/admin/whatsapp" />
      <main className="max-w-[1000px] mx-auto px-8 py-6">
        <AdminWhatsAppClient initialStatus={status} />
      </main>
    </>
  );
}
