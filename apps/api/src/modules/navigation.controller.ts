import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { NavigationService } from './navigation.service';
import { SessionService } from './session.service';

@Controller('/api/navigation')
export class NavigationController {
  constructor(
    private readonly navigation: NavigationService,
    private readonly sessions: SessionService
  ) {}

  @Get()
  async getNavigation(@Req() request: Request): Promise<{ domains: Awaited<ReturnType<NavigationService['getNavigation']>> }> {
    const session = this.sessions.get(request);
    if (!session) throw new UnauthorizedException({ error: { code: 'SESSION_REQUIRED', message: '请先登录' } });
    return { domains: await this.navigation.getNavigation(session.permissionPoints) };
  }
}
