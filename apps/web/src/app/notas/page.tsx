import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { NotasClient } from './notas-client';

export const dynamic = 'force-dynamic';

interface Nota {
  id: string;
  titulo: string | null;
  conteudo: string;
  tag: 'IDEIA' | 'INSIGHT' | 'LEMBRETE' | 'META' | 'REFERENCIA' | 'PERGUNTA';
  fixada: boolean;
  origem: string;
  createdAt: string;
}

export default async function NotasPage() {
  const notas = await api<Nota[]>('/me/notas');

  return (
    <>
      <TopNav active="/notas" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <NotasClient notas={notas} />
      </main>
      <WhatsAppFAB />
    </>
  );
}
