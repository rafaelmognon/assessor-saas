import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { CategoriasClient } from './categorias-client';

export const dynamic = 'force-dynamic';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  tipo: 'SAIDA' | 'ENTRADA';
  metaMensal: string | null;
}

export default async function CategoriasPage() {
  const categorias = await api<Categoria[]>('/me/categorias');

  return (
    <>
      <TopNav active="/categorias" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        <CategoriasClient categorias={categorias} />
      </main>
      <WhatsAppFAB />
    </>
  );
}
