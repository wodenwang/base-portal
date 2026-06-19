import { describe, expect, it } from 'vitest';
import { normalizePermissionItems } from '../src/modules/auth.service';

describe('normalizePermissionItems', () => {
  it('normalizes string and object permission items', () => {
    expect(normalizePermissionItems(['base-portal.a', { key: 'base-portal.b' }, {}, { key: undefined }])).toEqual([
      'base-portal.a',
      'base-portal.b'
    ]);
  });

  it('returns an empty list for missing or malformed permission arrays', () => {
    expect(normalizePermissionItems(undefined)).toEqual([]);
  });
});
