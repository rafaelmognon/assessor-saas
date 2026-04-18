import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { TransacoesClient } from './transacoes-client';

export const dynamic = 'force-dynamic';

interface Transacao {
  id: string;
  descricao: string;
  valor: string;
  tipo: 'ENTRADA' | 'SAIDA';
  formaPagamento: string;
  origem: string;
  data: string;
  parcelaAtual: number | null;
  parcelasTotal: number | null;
  categoria: { nome: string; icone: string; cor: string } | null;
  cartao: { apelido: string; ultimos4: string; cor: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  tipo: 'SAIDA' | 'ENTRADA';
}

interface Cartao {
  id: string;
  apelido: string;
  ultimos4: string;
}

export default async function TransacoesPage() {
  const [transacoes, categorias, cartoes] = await Promise.all([
    api<Transacao[]>('/me/transacoes?limit=100'),
    api<Categoria[]>('/me/categorias'),
    api<Cartao[]>('/me/cartoes'),
  ]);

  return (
    <>
      <TopNav active="/transacoes" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <TransacoesClient transacoes={transacoes} categorias={categorias} cartoes={cartoes} />
      </main>
      <WhatsAppFAB />
    </>
  );
}
