import type { NavigationResponse, SessionResponse } from './types';

export async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch('/api/session', { credentials: 'include' });
  if (!response.ok) return { authenticated: false };
  return await response.json() as SessionResponse;
}

export async function fetchNavigation(): Promise<NavigationResponse> {
  const response = await fetch('/api/navigation', { credentials: 'include' });
  if (!response.ok) throw new Error('navigation request failed');
  return await response.json() as NavigationResponse;
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
}

export async function recordMenuOpened(input: {
  domainKey: string;
  domainName: string;
  menuId: string;
  menuTitle: string;
  openMode: string;
}): Promise<void> {
  try {
    await fetch('/api/audit/menu-opened', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
  } catch {
    // Audit failures must not block user navigation.
  }
}
