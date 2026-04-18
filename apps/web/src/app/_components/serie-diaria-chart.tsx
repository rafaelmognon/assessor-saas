'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { fmtMoney } from '@/lib/format';

interface DiaPoint {
  dia: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function SerieDiariaChart({ data }: { data: DiaPoint[] }) {
  const [view, setView] = useState<'todos' | 'saldo' | 'movimentacao'>('todos');

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900">Evolução do Saldo no Período</h3>
        <div className="text-center py-12 text-slate-400 text-sm">
          Sem transações no mês ainda.
        </div>
      </div>
    );
  }

  // Formato pro eixo X: "01", "02", "15"...
  const chartData = data.map((d) => ({
    ...d,
    label: d.dia.slice(-2),
  }));

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Evolução do Saldo no Período</h3>
          <p className="text-xs text-slate-500 mt-0.5">Movimentação dia a dia · {data.length} dias</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setView('todos')}
            className={view === 'todos' ? 'px-3 py-1 bg-white rounded-md font-semibold shadow-sm' : 'px-3 py-1 text-slate-600'}
          >
            Tudo
          </button>
          <button
            onClick={() => setView('saldo')}
            className={view === 'saldo' ? 'px-3 py-1 bg-white rounded-md font-semibold shadow-sm' : 'px-3 py-1 text-slate-600'}
          >
            Saldo
          </button>
          <button
            onClick={() => setView('movimentacao')}
            className={view === 'movimentacao' ? 'px-3 py-1 bg-white rounded-md font-semibold shadow-sm' : 'px-3 py-1 text-slate-600'}
          >
            Movimentação
          </button>
        </div>
      </div>

      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : `R$ ${v}`
              }
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label) => `Dia ${label}`}
              formatter={(value: number, name: string) => [fmtMoney(value), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />

            {(view === 'todos' || view === 'movimentacao') && (
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={6} />
            )}
            {(view === 'todos' || view === 'movimentacao') && (
              <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={6} />
            )}
            {(view === 'todos' || view === 'saldo') && (
              <Area
                type="monotone"
                dataKey="saldo"
                name="Saldo Acumulado"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#saldoGrad)"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
