import { Injectable } from '@nestjs/common';
import type { PortalSession, PortalUser } from './session.service';
import { PrismaService } from './prisma.service';

export type IamPermissionResponse = {
  permission_points?: Array<{ key?: string } | string>;
  permission_groups?: Array<{ key?: string } | string>;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  buildAuthorizeUrl(state: string): string {
    const baseUrl = requiredEnv('FEISHU_IAM_URL');
    const clientId = requiredEnv('FEISHU_IAM_CLIENT_ID');
    const redirectUri = process.env.FEISHU_IAM_REDIRECT_URI ?? 'https://base-portal.riversoft.com.cn';
    const url = new URL('/oauth/authorize', baseUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'openid profile');
    return url.toString();
  }

  async createMockSessionInput(): Promise<Omit<PortalSession, 'id' | 'createdAt' | 'expiresAt'>> {
    const menus = await this.prisma.portalMenu.findMany({
      where: { isLeaf: true, status: 'active', resourceKey: { not: null } },
      select: { resourceKey: true }
    });
    return {
      user: {
        id: process.env.PORTAL_MOCK_USER_ID ?? 'mock-user-001',
        name: process.env.PORTAL_MOCK_USER_NAME ?? '本地测试用户',
        avatarUrl: null
      },
      permissionPoints: menus.flatMap((menu) => (menu.resourceKey ? [menu.resourceKey] : [])),
      permissionGroups: ['base-portal.local-testers']
    };
  }

  async exchangeCodeForSessionInput(code: string): Promise<Omit<PortalSession, 'id' | 'createdAt' | 'expiresAt'>> {
    const token = await this.exchangeCode(code);
    const user = await this.fetchUserInfo(token.access_token);
    const permissions = await this.fetchPermissions(token.access_token);
    return {
      user,
      permissionPoints: normalizePermissionItems(permissions.permission_points),
      permissionGroups: normalizePermissionItems(permissions.permission_groups)
    };
  }

  private async exchangeCode(code: string): Promise<{ access_token: string }> {
    const baseUrl = requiredEnv('FEISHU_IAM_URL');
    const clientId = requiredEnv('FEISHU_IAM_CLIENT_ID');
    const clientSecret = requiredEnv('FEISHU_IAM_CLIENT_SECRET');
    const redirectUri = process.env.FEISHU_IAM_REDIRECT_URI ?? 'https://base-portal.riversoft.com.cn';
    const response = await fetch(new URL('/oauth/token', baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });
    if (!response.ok) throw new Error(`IAM token exchange failed: ${response.status}`);
    return assertAccessToken(await response.json());
  }

  private async fetchUserInfo(accessToken: string): Promise<PortalUser> {
    const baseUrl = requiredEnv('FEISHU_IAM_URL');
    const response = await fetch(new URL('/oauth/userinfo', baseUrl), {
      headers: { authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`IAM userinfo failed: ${response.status}`);
    const body = await response.json() as Record<string, unknown>;
    return {
      id: String(body.user_id ?? body.sub ?? body.open_id ?? ''),
      name: String(body.name ?? body.display_name ?? 'IAM 用户'),
      avatarUrl: typeof body.avatar_url === 'string' ? body.avatar_url : null
    };
  }

  private async fetchPermissions(accessToken: string): Promise<IamPermissionResponse> {
    const baseUrl = requiredEnv('FEISHU_IAM_URL');
    const appKey = process.env.FEISHU_IAM_APP_KEY ?? 'base-portal';
    const response = await fetch(new URL(`/api/v1/apps/${appKey}/me/permissions`, baseUrl), {
      headers: { authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`IAM permissions failed: ${response.status}`);
    return await response.json() as IamPermissionResponse;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertAccessToken(body: unknown): { access_token: string } {
  if (!body || typeof body !== 'object' || typeof (body as { access_token?: unknown }).access_token !== 'string') {
    throw new Error('IAM token response missing access_token');
  }
  return { access_token: (body as { access_token: string }).access_token };
}

function normalizePermissionItems(items: IamPermissionResponse['permission_points']): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item.key === 'string') return [item.key];
    return [];
  });
}
