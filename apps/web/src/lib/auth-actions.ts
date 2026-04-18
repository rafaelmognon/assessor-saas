'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { api, ApiError } from './api';
import { setAuthCookies, clearAuthCookies, getRefreshToken } from './auth';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  if (!email || !senha) return { ok: false, error: 'Preencha e-mail e senha' };

  try {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, senha }),
    });
    setAuthCookies(data.accessToken, data.refreshToken);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: 'Erro inesperado' };
  }
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const nome = String(formData.get('nome') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();

  if (!email || !nome || !senha || !whatsapp) return { ok: false, error: 'Preencha todos os campos' };

  try {
    const data = await api<AuthResponse>('/auth/signup', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, nome, senha, whatsapp }),
    });
    setAuthCookies(data.accessToken, data.refreshToken);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'Erro inesperado' };
  }
}

export async function logoutAction() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await api('/auth/logout', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ refreshToken: rt }),
      });
    } catch {
      // ignora — vamos limpar local de qualquer jeito
    }
  }
  clearAuthCookies();
  revalidatePath('/');
  redirect('/login');
}
