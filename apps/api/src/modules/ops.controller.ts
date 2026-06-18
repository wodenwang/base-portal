import { Body, Controller, ForbiddenException, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from './audit.service';
import { PrismaService } from './prisma.service';
import { SessionService } from './session.service';

type SyncBody = {
  dryRun?: boolean;
};

@Controller('/api/ops')
export class OpsController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService
  ) {}

  @Post('/sync-iam-resources')
  async syncIamResources(@Req() request: Request, @Body() body: SyncBody): Promise<{ ok: true; synced: number; dryRun: boolean }> {
    const session = this.sessions.get(request);
    if (!session) throw new UnauthorizedException({ error: { code: 'SESSION_REQUIRED', message: '请先登录' } });
    if (!adminUserIds().includes(session.user.id)) {
      throw new ForbiddenException({ error: { code: 'PORTAL_ADMIN_REQUIRED', message: '需要 Portal 运维权限' } });
    }

    const menus = await this.prisma.portalMenu.findMany({
      where: { status: 'active', isLeaf: true, resourceKey: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
    });
    const dryRun = body.dryRun ?? !process.env.FEISHU_IAM_DEVELOPER_API_TOKEN;
    if (!dryRun) {
      await syncPermissionPoints(menus.map((menu) => ({
        key: menu.resourceKey ?? '',
        name: menu.title,
        description: `Base Portal 菜单：${menu.title}`
      })));
    }

    await this.audit.record({
      eventType: 'iam_resource_sync',
      session,
      detail: { dryRun, count: menus.length }
    });
    return { ok: true, synced: menus.length, dryRun };
  }
}

function adminUserIds(): string[] {
  return (process.env.PORTAL_ADMIN_USER_IDS ?? process.env.PORTAL_MOCK_USER_ID ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function syncPermissionPoints(points: Array<{ key: string; name: string; description: string }>): Promise<void> {
  const baseUrl = requiredEnv('FEISHU_IAM_URL');
  const appKey = process.env.FEISHU_IAM_APP_KEY ?? 'base-portal';
  const token = requiredEnv('FEISHU_IAM_DEVELOPER_API_TOKEN');
  for (const point of points) {
    if (!point.key.startsWith('base-portal.')) {
      throw new Error(`Invalid permission key: ${point.key}`);
    }
    const response = await fetch(new URL(`/api/v1/developer/apps/${appKey}/permission-points`, baseUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(point)
    });
    if (!response.ok && response.status !== 409) {
      throw new Error(`IAM permission point sync failed: ${response.status}`);
    }
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
