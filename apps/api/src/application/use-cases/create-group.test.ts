import { describe, expect, it } from 'vitest';
import { InvalidGroupError } from '../../domain/groups/invalid-group.error';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import type { IdGenerator } from '../ports/id-generator';
import { CreateGroup } from './create-group';

// Stub: always hands out the next id from a fixed list, so the test knows what to expect.
const fixedIds = (...ids: string[]): IdGenerator => ({ next: () => ids.shift() ?? 'no-more-ids' });

describe('CreateGroup', () => {
  it('creates a group with a new id and stores it', async () => {
    const groups = new InMemoryGroupRepository();
    const createGroup = new CreateGroup(groups, fixedIds('group-1'));

    const group = await createGroup.execute({ name: 'Trip to Bariloche' });

    expect(group.id).toBe('group-1');
    // Check the outcome (it is stored), not the calls made to get there.
    const stored = await groups.findById('group-1');
    expect(stored?.name).toBe('Trip to Bariloche');
  });

  it('stores nothing when the name is invalid', async () => {
    const groups = new InMemoryGroupRepository();
    const createGroup = new CreateGroup(groups, fixedIds('group-1'));

    await expect(createGroup.execute({ name: '   ' })).rejects.toThrow(InvalidGroupError);
    expect(await groups.findById('group-1')).toBeNull();
  });
});
