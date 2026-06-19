import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSession } from './api';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats unauthorized session responses as unauthenticated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(fetchSession()).resolves.toEqual({ authenticated: false });
  });

  it('throws on failed session initialization responses', async () => {
    // Regression: QA-006 - session 5xx was rendered as logged-out instead of initialization failure.
    // Found by /qa on 2026-06-19.
    // Report: docs/qa/2026-06-19-systematic-functional-qa.md
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('server error', { status: 500 })));

    await expect(fetchSession()).rejects.toThrow('session request failed');
  });
});
