import 'server-only';
import { cookies } from 'next/headers';

const ACCESS_COOKIE = 'assessor_access';
const REFRESH_COOKIE = 'assessor_refresh';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...COOKIE_OPTS, maxAge: 60 * 15 }); // 15min
  jar.set(REFRESH_COOKIE, refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 }); // 7d
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

export function getRefreshToken(): string | undefined {
  return cookies().get(REFRESH_COOKIE)?.value;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
