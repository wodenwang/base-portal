import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from './audit.service';
import { SessionService } from './session.service';

type MenuOpenedBody = {
  domainKey?: string;
  domainName?: string;
  menuId?: string;
  menuTitle?: string;
  openMode?: string;
};

@Controller('/api/audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly sessions: SessionService
  ) {}

  @Post('/menu-opened')
  async menuOpened(@Req() request: Request, @Body() body: MenuOpenedBody): Promise<{ ok: true }> {
    const session = this.sessions.get(request);
    if (!session) throw new UnauthorizedException({ error: { code: 'SESSION_REQUIRED', message: '请先登录' } });
    await this.audit.record({
      eventType: 'menu_opened',
      session,
      domainKey: body.domainKey,
      domainName: body.domainName,
      menuId: body.menuId,
      menuTitle: body.menuTitle,
      openMode: body.openMode
    });
    return { ok: true };
  }
}
