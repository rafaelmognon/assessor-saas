import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { CompromissosClient } from './compromissos-client';

export const dynamic = 'force-dynamic';

interface Compromisso {
  id: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  cor: string;
  origem: string;
}

export default async function CompromissosPage() {
  const compromissos = await api<Compromisso[]>('/me/compromissos');

  return (
    <>
      <TopNav active="/compromissos" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <CompromissosClient compromissos={compromissos} />
      </main>
      <WhatsAppFAB />
    </>
  );
}
