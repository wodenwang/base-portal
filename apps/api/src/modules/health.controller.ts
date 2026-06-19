import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('/ready')
  async ready(): Promise<{ status: 'ready'; checks: { database: 'ok' } }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready', checks: { database: 'ok' } };
  }

  @Get('/version')
  version(): { name: string; version: string; commit: string; node_env: string } {
    return {
      name: 'base-portal-api',
      version: process.env.APP_VERSION ?? '0.1.1',
      commit: process.env.GIT_COMMIT ?? 'local',
      node_env: process.env.NODE_ENV ?? 'development'
    };
  }
}
