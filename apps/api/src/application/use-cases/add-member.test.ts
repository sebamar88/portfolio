import { describe, expect, it } from 'vitest';
import { Group } from '../../domain/groups/group';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { AddMember } from './add-member';

describe('AddMember', () => {
  it('adds the member and stores the group', async () => {
    const groups = new InMemoryGroupRepository();
    await groups.save(Group.create({ id: 'g1', name: 'Trip' }));

    const group = await new AddMember(groups).execute({ groupId: 'g1', memberId: 'ana' });

    expect(group.memberIds).toEqual(['ana']);
    expect((await groups.findById('g1'))?.memberIds).toEqual(['ana']);
  });

  it('fails with GroupNotFoundError for an unknown group', async () => {
    const addMember = new AddMember(new InMemoryGroupRepository());
    await expect(addMember.execute({ groupId: 'nope', memberId: 'ana' })).rejects.toThrow(GroupNotFoundError);
  });

  it('keeps the stored group unchanged when the member is a duplicate', async () => {
    const groups = new InMemoryGroupRepository();
    const group = Group.create({ id: 'g1', name: 'Trip' });
    group.addMember('ana');
    await groups.save(group);

    await expect(new AddMember(groups).execute({ groupId: 'g1', memberId: 'ana' })).rejects.toThrow('already a member');
    expect((await groups.findById('g1'))?.memberIds).toEqual(['ana']);
  });
});
