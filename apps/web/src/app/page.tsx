import { TopNav } from '@/components/topnav';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { api } from '@/lib/api';
import { fmtMoney, fmtMoneyShort, fmtDate } from '@/lib/format';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { CategoriasDonut } from './_components/categorias-donut';
import { CartoesList } from './_components/cartoes-list';
import { PagamentosBar } from './_components/pagamentos-bar';

export const dynamic = 'force-dynamic';

interface ResumoResponse {
  receitas: { total: string | number; transacoes: number };
  despesas: { total: string | number; transacoes: number };
  saldo: number;
  porCategoria: Array<{
    categoria: { nome: string; icone: string; cor: string } | null;
    total: string | number;
    transacoes: number;
  }>;
  porPagamento: Array<{ forma: string; total: string | number; transacoes: number }>;
}

interface Compromisso {
  id: string;
  titulo: string;
  inicio: string;
  fim: string | null;
  local: string | null;
  cor: string;
  origem: string;
}

interface Cartao {
  id: string;
  apelido: string;
  ultimos4: string;
  cor: string;
  limite: string | null;
  faturaAberta: string | number;
  diaFecha: number | null;
  diaVence: number | null;
}

export default async function VisaoGeralPage() {
  const [resumo, proximos, cartoes] = await Promise.all([
    api<ResumoResponse>('/me/transacoes/resumo'),
    api<Compromisso[]>('/me/compromissos/proximos?limit=4'),
    api<Cartao[]>('/me/cartoes'),
  ]);

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <>
      <TopNav active="/" />
      <main className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Subheader */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 capitalize">{mesAtual}</h1>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-medium text-slate-600 rounded-md">
                Semana
              </button>
              <button className="px-4 py-1.5 text-xs bg-white rounded-md shadow-sm font-semibold">
                Mês
              </button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-600 rounded-md">
                Hoje
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Coluna esquerda */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Resultado do Período */}
            <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm text-slate-500">Saldo do Período</span>
                <span
                  className={`text-xs font-semibold ${
                    resumo.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {resumo.saldo >= 0 ? '↑' : '↓'} mês atual
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
                {fmtMoney(resumo.saldo)}
              </div>
              <div className="text-xs text-slate-400">
                {resumo.receitas.transacoes + resumo.despesas.transacoes} transações no mês
              </div>
            </div>

            {/* Entradas */}
            <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Entradas</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Receitas
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Realizado</span>
                <span className="text-lg font-bold text-emerald-600">
                  {fmtMoney(resumo.receitas.total)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Transações</span>
                <span className="text-sm font-semibold text-slate-900">
                  {resumo.receitas.transacoes}
                </span>
              </div>
            </div>

            {/* Saídas */}
            <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Saídas</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                  Despesas
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Realizado</span>
                <span className="text-lg font-bold text-rose-600">
                  {fmtMoney(resumo.despesas.total)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Transações</span>
                <span className="text-sm font-semibold text-slate-900">
                  {resumo.despesas.transacoes}
                </span>
              </div>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Pagamentos */}
            <PagamentosBar porPagamento={resumo.porPagamento} totalDespesas={Number(resumo.despesas.total)} />

            {/* Faturas */}
            <CartoesList cartoes={cartoes} />

            {/* Próximos Compromissos */}
            <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-slate-900">Próximos Compromissos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {proximos.length === 0 ? 'Nenhum compromisso agendado' : 'Agenda dos próximos dias'}
                  </p>
                </div>
                <a
                  href="/compromissos"
                  className="text-xs text-indigo-600 font-medium hover:underline"
                >
                  Ver agenda completa →
                </a>
              </div>

              {proximos.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Você não tem compromissos. Mande pelo WhatsApp ou cadastre na agenda.
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {proximos.map((c) => (
                    <div
                      key={c.id}
                      className="relative border border-slate-200 rounded-xl p-4 hover:shadow-sm transition"
                    >
                      <div
                        className="absolute top-0 left-0 h-full w-1 rounded-l-xl"
                        style={{ background: corBar(c.cor) }}
                      />
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                        {fmtDateLabel(c.inicio)}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">
                        {fmtTime(c.inicio)}
                        {c.fim ? ` — ${fmtTime(c.fim)}` : ''}
                      </div>
                      <div className="font-semibold text-slate-900 text-sm leading-tight mb-1">
                        {c.titulo}
                      </div>
                      {c.local && <div className="text-[11px] text-slate-500">{c.local}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donut categorias */}
            <CategoriasDonut porCategoria={resumo.porCategoria} totalDespesas={Number(resumo.despesas.total)} />
          </div>
        </div>
      </main>

      <WhatsAppFAB />
    </>
  );
}

function corBar(cor: string): string {
  const map: Record<string, string> = {
    indigo: '#6366f1',
    purple: '#a855f7',
    pink: '#ec4899',
    rose: '#f43f5e',
    orange: '#f97316',
    amber: '#f59e0b',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    blue: '#3b82f6',
    slate: '#64748b',
  };
  return map[cor] ?? '#6366f1';
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = (target.getTime() - hoje.getTime()) / 86400e3;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
