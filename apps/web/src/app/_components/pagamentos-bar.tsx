import { fmtMoney } from '@/lib/format';

interface PorPagamento {
  forma: string;
  total: string | number;
  transacoes: number;
}

const META: Record<string, { label: string; icone: string; bg: string; bar: string; text: string }> = {
  CREDITO:       { label: 'Crédito',       icone: '💳', bg: 'bg-violet-50', bar: 'bg-violet-500', text: 'text-violet-600' },
  PIX:           { label: 'PIX',           icone: '⚡', bg: 'bg-cyan-50',   bar: 'bg-cyan-500',   text: 'text-cyan-600' },
  DEBITO:        { label: 'Débito',        icone: '💳', bg: 'bg-blue-50',   bar: 'bg-blue-500',   text: 'text-blue-600' },
  DINHEIRO:      { label: 'Dinheiro',      icone: '💵', bg: 'bg-slate-100', bar: 'bg-slate-400',  text: 'text-slate-600' },
  BOLETO:        { label: 'Boleto',        icone: '📄', bg: 'bg-amber-50',  bar: 'bg-amber-500',  text: 'text-amber-600' },
  TRANSFERENCIA: { label: 'Transferência', icone: '🏦', bg: 'bg-teal-50',   bar: 'bg-teal-500',   text: 'text-teal-600' },
};

export function PagamentosBar({
  porPagamento,
  totalDespesas,
}: {
  porPagamento: PorPagamento[];
  totalDespesas: number;
}) {
  if (porPagamento.length === 0 || totalDespesas === 0) {
    return null;
  }

  const ordenado = [...porPagamento]
    .map((p) => ({ ...p, totalNum: Number(p.total), pct: (Number(p.total) / totalDespesas) * 100 }))
    .sort((a, b) => b.totalNum - a.totalNum);

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Gastos por forma de pagamento</h3>
          <p className="text-xs text-slate-500">Mês atual · {fmtMoney(totalDespesas)}</p>
        </div>
      </div>

      {/* Barra empilhada */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5">
        {ordenado.map((p) => {
          const m = META[p.forma] ?? META.DINHEIRO;
          return (
            <div
              key={p.forma}
              className={m.bar}
              style={{ width: `${p.pct}%` }}
              title={`${m.label}: ${fmtMoney(p.totalNum)} (${p.pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ordenado.map((p) => {
          const m = META[p.forma] ?? META.DINHEIRO;
          return (
            <div key={p.forma} className="text-center">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center text-lg mx-auto mb-1.5`}>
                {m.icone}
              </div>
              <div className="text-xs text-slate-500">{m.label}</div>
              <div className="text-sm font-bold text-slate-900">{fmtMoney(p.totalNum)}</div>
              <div className={`text-[10px] font-semibold ${m.text}`}>{p.pct.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
