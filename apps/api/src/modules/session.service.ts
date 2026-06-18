import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

export type PortalUser = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type PortalSession = {
  id: string;
  user: PortalUser;
  permissionPoints: string[];
  permissionGroups: string[];
  createdAt: string;
  expiresAt: string;
};

const COOKIE_NAME = 'bp_session';
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, PortalSession>();

  create(response: Response, input: Omit<PortalSession, 'id' | 'createdAt' | 'expiresAt'>): PortalSession {
    const now = Date.now();
    const session: PortalSession = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + Number(process.env.SESSION_TTL_MS ?? DEFAULT_TTL_MS)).toISOString()
    };
    this.sessions.set(session.id, session);
    response.cookie(COOKIE_NAME, session.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureCookie(),
      path: '/',
      expires: new Date(session.expiresAt)
    });
    return session;
  }

  get(request: Request): PortalSession | null {
    const sessionId = readCookie(request, COOKIE_NAME);
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  destroy(request: Request, response: Response): void {
    const sessionId = readCookie(request, COOKIE_NAME);
    if (sessionId) this.sessions.delete(sessionId);
    response.clearCookie(COOKIE_NAME, { path: '/' });
  }
}

function shouldUseSecureCookie(): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.cookie;
  if (!raw) return null;
  for (const pair of raw.split(';')) {
    const [key, ...valueParts] = pair.trim().split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }
  return null;
}
