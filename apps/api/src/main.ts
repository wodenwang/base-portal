import { extname, join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './modules/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.PORTAL_WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true
  });

  const staticDir = join(__dirname, '../../../portal-web/dist');
  app.useStaticAssets(staticDir);
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.method !== 'GET') return next();
    if (request.path.startsWith('/api') || request.path.startsWith('/oauth')) return next();
    if (['/health', '/ready', '/version'].includes(request.path)) return next();
    if (request.path === '/' && (request.query.code || request.query.state)) return next();
    if (extname(request.path)) return next();
    response.sendFile(join(staticDir, 'index.html'));
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
