'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from './api';

interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function call<T>(
  fn: () => Promise<T>,
  revalidate?: string,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    if (revalidate) revalidatePath(revalidate);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'Erro inesperado' };
  }
}

// ─────── Transações ───────
export async function createTransacaoAction(input: any) {
  return call(
    () => api('/me/transacoes', { method: 'POST', body: JSON.stringify(input) }),
    '/transacoes',
  );
}
export async function updateTransacaoAction(id: string, input: any) {
  return call(
    () => api(`/me/transacoes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    '/transacoes',
  );
}
export async function deleteTransacaoAction(id: string) {
  return call(() => api(`/me/transacoes/${id}`, { method: 'DELETE' }), '/transacoes');
}

// ─────── Categorias ───────
export async function createCategoriaAction(input: any) {
  return call(
    () => api('/me/categorias', { method: 'POST', body: JSON.stringify(input) }),
    '/categorias',
  );
}
export async function updateCategoriaAction(id: string, input: any) {
  return call(
    () => api(`/me/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    '/categorias',
  );
}
export async function deleteCategoriaAction(id: string) {
  return call(() => api(`/me/categorias/${id}`, { method: 'DELETE' }), '/categorias');
}

// ─────── Cartões ───────
export async function createCartaoAction(input: any) {
  return call(() => api('/me/cartoes', { method: 'POST', body: JSON.stringify(input) }), '/cartoes');
}
export async function updateCartaoAction(id: string, input: any) {
  return call(
    () => api(`/me/cartoes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    '/cartoes',
  );
}
export async function deleteCartaoAction(id: string) {
  return call(() => api(`/me/cartoes/${id}`, { method: 'DELETE' }), '/cartoes');
}

// ─────── Compromissos ───────
export async function createCompromissoAction(input: any) {
  return call(
    () => api('/me/compromissos', { method: 'POST', body: JSON.stringify(input) }),
    '/compromissos',
  );
}
export async function updateCompromissoAction(id: string, input: any) {
  return call(
    () => api(`/me/compromissos/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    '/compromissos',
  );
}
export async function deleteCompromissoAction(id: string) {
  return call(
    () => api(`/me/compromissos/${id}`, { method: 'DELETE' }),
    '/compromissos',
  );
}

// ─────── Notas ───────
export async function createNotaAction(input: any) {
  return call(() => api('/me/notas', { method: 'POST', body: JSON.stringify(input) }), '/notas');
}
export async function updateNotaAction(id: string, input: any) {
  return call(
    () => api(`/me/notas/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    '/notas',
  );
}
export async function deleteNotaAction(id: string) {
  return call(() => api(`/me/notas/${id}`, { method: 'DELETE' }), '/notas');
}
