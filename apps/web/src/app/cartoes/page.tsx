import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { CartoesClient } from './cartoes-client';

export const dynamic = 'force-dynamic';

interface Cartao {
  id: string;
  apelido: string;
  tipo: string;
  bandeira: string;
  ultimos4: string;
  cor: string;
  limite: string | null;
  faturaAberta: string | number;
  diaFecha: number | null;
  diaVence: number | null;
}

export default async function CartoesPage() {
  const cartoes = await api<Cartao[]>('/me/cartoes');

  return (
    <>
      <TopNav active="/cartoes" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <CartoesClient cartoes={cartoes} />
      </main>
      <WhatsAppFAB />
    </>
  );
}
