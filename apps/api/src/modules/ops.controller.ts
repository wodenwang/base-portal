import { Body, Controller, ForbiddenException, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { OpsService, type PortalAppPackage } from './ops.service';
import { SessionService } from './session.service';

type SyncBody = {
  dryRun?: boolean;
  package?: PortalAppPackage;
};

type ImportBody = {
  dryRun?: boolean;
  package?: PortalAppPackage;
};

@Controller('/api/ops')
export class OpsController {
  constructor(
    private readonly ops: OpsService,
    private readonly sessions: SessionService
  ) {}

  @Post('/sync-iam-resources')
  async syncIamResources(@Req() request: Request, @Body() body: SyncBody) {
    const session = this.requireAdminSession(request);
    const bodyRecord: Record<string, unknown> = isRecord(body) ? body : {};
    return this.ops.syncIamResources(session, {
      dryRun: parseOptionalBoolean(bodyRecord.dryRun),
      package: bodyRecord.package as PortalAppPackage | undefined
    });
  }

  @Post('/import-app-package')
  async importAppPackage(@Req() request: Request, @Body() body: ImportBody | PortalAppPackage) {
    const session = this.requireAdminSession(request);
    const bodyRecord: Record<string, unknown> = isRecord(body) ? body : {};
    const appPackage = 'package' in bodyRecord && bodyRecord.package ? bodyRecord.package as PortalAppPackage : bodyRecord as PortalAppPackage;
    const dryRun = parseOptionalBoolean(bodyRecord.dryRun) ?? true;
    return this.ops.importAppPackage(session, appPackage, { dryRun });
  }

  private requireAdminSession(request: Request) {
    const session = this.sessions.get(request);
    if (!session) throw new UnauthorizedException({ error: { code: 'SESSION_REQUIRED', message: '请先登录' } });
    if (!adminUserIds().includes(session.user.id)) {
      throw new ForbiddenException({ error: { code: 'PORTAL_ADMIN_REQUIRED', message: '需要 Portal 运维权限' } });
    }
    return session;
  }
}

function adminUserIds(): string[] {
  return (process.env.PORTAL_ADMIN_USER_IDS ?? process.env.PORTAL_MOCK_USER_ID ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}
