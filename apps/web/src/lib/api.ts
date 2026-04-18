import 'server-only';
import { getAccessToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

interface ApiOptions extends RequestInit {
  /** Anexa Bearer do cookie. Default: true */
  auth?: boolean;
}

/**
 * Wrapper de fetch para chamar a API a partir de Server Components / Server Actions.
 * Sempre usa cache 'no-store' (dados sempre frescos).
 */
export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { auth = true, headers = {}, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    cache: 'no-store',
    ...rest,
    headers: finalHeaders,
  });

  if (res.status === 204) return null as T;

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg = (body && (body as any).message) || res.statusText;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : msg, body);
  }

  return body as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
