/** Helpers de formatação reutilizáveis (BR) */

export function fmtMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtMoneyShort(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return fmtMoney(n);
}

export function fmtDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', opts);
}

export function fmtDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  const dias = Math.floor(diff / 86400);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `${dias} dias atrás`;
  return fmtDate(d);
}

export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
