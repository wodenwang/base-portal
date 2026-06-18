import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import type { PortalSession } from './session.service';

export type AuditInput = {
  eventType: string;
  session?: PortalSession | null;
  domainKey?: string;
  domainName?: string;
  menuId?: string;
  menuTitle?: string;
  openMode?: string;
  detail?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<void> {
    await this.prisma.portalAuditEvent.create({
      data: {
        id: randomUUID(),
        eventType: input.eventType,
        userId: input.session?.user.id,
        userName: input.session?.user.name,
        domainKey: input.domainKey,
        domainName: input.domainName,
        menuId: input.menuId,
        menuTitle: input.menuTitle,
        openMode: input.openMode,
        detail: input.detail
      }
    });
  }
}
