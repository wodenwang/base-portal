import { randomUUID } from 'node:crypto';
import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService
  ) {}

  @Get('/api/session')
  getSession(@Req() request: Request): { authenticated: boolean; user?: unknown; permissionPoints?: string[] } {
    const session = this.sessions.get(request);
    if (!session) return { authenticated: false };
    return {
      authenticated: true,
      user: session.user,
      permissionPoints: session.permissionPoints
    };
  }

  @Get('/api/auth/login')
  login(@Res() response: Response): void {
    if (process.env.PORTAL_ENABLE_MOCK_AUTH === 'true') {
      response.redirect('/api/auth/mock-login');
      return;
    }
    response.redirect(this.auth.buildAuthorizeUrl(randomUUID()));
  }

  @Get('/api/auth/mock-login')
  async mockLogin(@Res() response: Response): Promise<void> {
    const session = this.sessions.create(response, await this.auth.createMockSessionInput());
    await this.audit.record({ eventType: 'login_success', session, detail: { mode: 'mock' } });
    response.redirect('/');
  }

  @Get('/oauth/callback')
  async oauthCallback(@Query('code') code: string | undefined, @Res() response: Response): Promise<void> {
    await this.finishOauthCallback(code, response);
  }

  @Get('/')
  async rootCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() response: Response
  ): Promise<void> {
    if (!code && !state) {
      response.sendFile('index.html', { root: `${__dirname}/../../../portal-web/dist` });
      return;
    }
    await this.finishOauthCallback(code, response);
  }

  @Post('/api/logout')
  async logout(@Req() request: Request, @Res() response: Response): Promise<void> {
    const session = this.sessions.get(request);
    await this.audit.record({ eventType: 'logout', session });
    this.sessions.destroy(request, response);
    response.json({ ok: true });
  }

  private async finishOauthCallback(code: string | undefined, response: Response): Promise<void> {
    if (!code) {
      response.status(400).json({ error: { code: 'OAUTH_CODE_REQUIRED', message: '缺少 OAuth code' } });
      return;
    }
    const session = this.sessions.create(response, await this.auth.exchangeCodeForSessionInput(code));
    await this.audit.record({ eventType: 'login_success', session, detail: { mode: 'iam' } });
    response.redirect('/');
  }
}
