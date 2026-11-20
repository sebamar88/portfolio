import { describe, expect, it } from 'vitest';
import { UuidIdGenerator } from './uuid-id-generator';

describe('UuidIdGenerator', () => {
  it('returns a UUID v4', () => {
    expect(new UuidIdGenerator().next()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns a different id each time', () => {
    const ids = new UuidIdGenerator();
    expect(ids.next()).not.toBe(ids.next());
  });
});
