import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HealthController } from './health.controller';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { OpsController } from './ops.controller';
import { PrismaService } from './prisma.service';
import { SessionService } from './session.service';

@Module({
  controllers: [AuditController, AuthController, HealthController, NavigationController, OpsController],
  providers: [AuditService, AuthService, NavigationService, PrismaService, SessionService]
})
export class AppModule {}
