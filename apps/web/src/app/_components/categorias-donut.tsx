'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { fmtMoney } from '@/lib/format';

interface PorCategoria {
  categoria: { nome: string; icone: string; cor: string } | null;
  total: string | number;
  transacoes: number;
}

const CORES: Record<string, string> = {
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

export function CategoriasDonut({
  porCategoria,
  totalDespesas,
}: {
  porCategoria: PorCategoria[];
  totalDespesas: number;
}) {
  const data = porCategoria
    .filter((p) => p.categoria)
    .map((p) => ({
      name: p.categoria!.nome,
      icone: p.categoria!.icone,
      value: Number(p.total),
      cor: CORES[p.categoria!.cor] ?? '#64748b',
      pct: totalDespesas > 0 ? (Number(p.total) / totalDespesas) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Despesas por Categoria</h3>
        <div className="text-center py-8 text-slate-400 text-sm">
          Sem despesas no mês ainda. Quando você registrar gastos, o gráfico aparece aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900">Despesas por Categoria</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="relative" style={{ height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {fmtMoney(totalDespesas)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Total no mês</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-4">Detalhes</div>
          <div className="space-y-4">
            {data.slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.cor }} />
                  <span className="text-sm text-slate-700">
                    {d.icone} {d.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{fmtMoney(d.value)}</div>
                  <div className="text-[11px] text-slate-400">{d.pct.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
