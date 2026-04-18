import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface Me {
  id: string;
  email: string;
  nome: string;
  whatsapp: string | null;
  plano: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  fusoHorario: string;
  moeda: string;
  createdAt: string;
}

export default async function ConfiguracoesPage() {
  const me = await api<Me>('/me');

  return (
    <>
      <TopNav active="/configuracoes" />
      <main className="max-w-[1000px] mx-auto px-8 py-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Configurações</h1>
        <p className="text-sm text-slate-500 mb-6">Sua conta e integrações</p>

        {/* Perfil */}
        <section className="bg-white border border-[#f1f1f3] rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Perfil</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {me.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{me.nome}</div>
              <div className="text-sm text-slate-500">{me.email}</div>
              <div className="text-xs text-slate-400 mt-1">
                Plano <strong className="text-indigo-600">{me.plano}</strong> · {me.subscriptionStatus}
              </div>
            </div>
          </div>
        </section>

        {/* Integrações */}
        <section id="whatsapp" className="bg-white border border-[#f1f1f3] rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Integrações</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-2xl">💬</div>
                <div>
                  <div className="font-medium text-slate-900">WhatsApp</div>
                  <div className="text-xs text-slate-500">
                    {me.whatsapp ? `Conectado: ${me.whatsapp}` : 'Não conectado'}
                  </div>
                </div>
              </div>
              <span className={
                me.whatsapp
                  ? 'inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full'
                  : 'inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full'
              }>
                {me.whatsapp ? '● Ativo' : 'Pendente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">📅</div>
                <div>
                  <div className="font-medium text-slate-900">Google Calendar</div>
                  <div className="text-xs text-slate-500">Disponível em breve</div>
                </div>
              </div>
              <button disabled className="px-3 py-1.5 text-xs border border-slate-200 text-slate-400 rounded-lg">
                Em breve
              </button>
            </div>
          </div>
        </section>

        {/* Conta */}
        <section className="bg-white border border-[#f1f1f3] rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Sua conta</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Fuso horário</dt>
              <dd className="font-medium text-slate-900">{me.fusoHorario}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Moeda</dt>
              <dd className="font-medium text-slate-900">{me.moeda}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Membro desde</dt>
              <dd className="font-medium text-slate-900">
                {new Date(me.createdAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            {me.trialEndsAt && (
              <div>
                <dt className="text-xs text-slate-500">Trial expira em</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(me.trialEndsAt).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </main>
      <WhatsAppFAB />
    </>
  );
}
