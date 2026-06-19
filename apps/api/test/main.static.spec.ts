import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { configureStaticAssets } from '../src/main';

type StaticMiddleware = (request: Request, response: Response, next: NextFunction) => void;

class StaticAppStub {
  staticDir: string | undefined;
  staticOptions: unknown;
  middleware: StaticMiddleware | undefined;

  useStaticAssets(staticDir: string, options?: unknown): void {
    this.staticDir = staticDir;
    this.staticOptions = options;
  }

  use(middleware: StaticMiddleware): void {
    this.middleware = middleware;
  }
}

describe('configureStaticAssets', () => {
  it('lets IAM OAuth root callbacks reach the Nest controller', () => {
    const app = new StaticAppStub();
    configureStaticAssets(app as never, '/portal-web/dist');

    let nextCalled = false;
    let sendFileCalled = false;
    app.middleware?.(
      { method: 'GET', path: '/', query: { code: 'redacted-code', state: 'redacted-state' } } as unknown as Request,
      { sendFile: () => void (sendFileCalled = true) } as unknown as Response,
      (() => void (nextCalled = true)) as NextFunction
    );

    expect(app.staticOptions).toEqual({ index: false });
    expect(nextCalled).toBe(true);
    expect(sendFileCalled).toBe(false);
  });

  it('serves the SPA shell for non-callback application routes', () => {
    const app = new StaticAppStub();
    configureStaticAssets(app as never, '/portal-web/dist');

    let servedPath = '';
    app.middleware?.(
      { method: 'GET', path: '/workspace/apps', query: {} } as unknown as Request,
      { sendFile: (path: string) => void (servedPath = path) } as unknown as Response,
      (() => undefined) as NextFunction
    );

    expect(servedPath).toBe('/portal-web/dist/index.html');
  });
});
