import { describe, expect, it } from 'vitest';
import { Group } from '../../domain/groups/group';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { GetGroup } from './get-group';

describe('GetGroup', () => {
  it('returns the stored group', async () => {
    const groups = new InMemoryGroupRepository();
    await groups.save(Group.create({ id: 'g1', name: 'Trip' }));

    const group = await new GetGroup(groups).execute({ groupId: 'g1' });

    expect(group.name).toBe('Trip');
  });

  it('fails with GroupNotFoundError for an unknown group', async () => {
    await expect(new GetGroup(new InMemoryGroupRepository()).execute({ groupId: 'nope' })).rejects.toThrow(
      GroupNotFoundError,
    );
  });
});
