import { TopNav } from '@/components/topnav';
import { api } from '@/lib/api';
import { WhatsAppClient } from './whatsapp-client';

export const dynamic = 'force-dynamic';

interface Info {
  numeroAssessor: string | null;
  online: boolean;
}

interface Me {
  whatsapp: string | null;
  nome: string;
}

export default async function WhatsAppPage() {
  const [info, me] = await Promise.all([
    api<Info>('/me/whatsapp').catch(() => ({ numeroAssessor: null, online: false })),
    api<Me>('/me').catch(() => ({ whatsapp: null, nome: '' })),
  ]);

  return (
    <>
      <TopNav active="/whatsapp" />
      <main className="max-w-[1000px] mx-auto px-8 py-6">
        <WhatsAppClient info={info} me={me} />
      </main>
    </>
  );
}
