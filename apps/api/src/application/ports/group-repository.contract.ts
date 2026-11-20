import { beforeEach, describe, expect, it } from 'vitest';
import { Group } from '../../domain/groups/group';
import type { GroupRepository } from './group-repository';

/**
 * Contract tests: the behavior every GroupRepository adapter must have. Each adapter's test file
 * calls this with its own factory, so the in-memory fake and Postgres are held to the same rules
 * and stay interchangeable. (Not a *.test.ts file: it only runs when an adapter calls it.)
 */
export function groupRepositoryContract(adapterName: string, makeRepository: () => GroupRepository | Promise<GroupRepository>) {
  describe(`GroupRepository contract (${adapterName})`, () => {
    let repository: GroupRepository;

    beforeEach(async () => {
      repository = await makeRepository();
    });

    it('returns null for an unknown id', async () => {
      expect(await repository.findById('does-not-exist')).toBeNull();
    });

    it('finds a saved group with its name and members, in order', async () => {
      const group = Group.create({ id: 'g1', name: 'Trip' });
      group.addMember('ana');
      group.addMember('bruno');
      await repository.save(group);

      const found = await repository.findById('g1');
      expect(found?.name).toBe('Trip');
      expect(found?.memberIds).toEqual(['ana', 'bruno']);
    });

    it('does not see changes made after save() until save() is called again', async () => {
      const group = Group.create({ id: 'g1', name: 'Trip' });
      await repository.save(group);

      group.addMember('ana');
      expect((await repository.findById('g1'))?.memberIds).toEqual([]);

      await repository.save(group);
      expect((await repository.findById('g1'))?.memberIds).toEqual(['ana']);
    });

    it('updates a group saved twice instead of duplicating it', async () => {
      const group = Group.create({ id: 'g1', name: 'Trip' });
      await repository.save(group);
      group.addMember('ana');
      await repository.save(group);

      expect((await repository.findById('g1'))?.memberIds).toEqual(['ana']);
    });

    it('hands out independent copies: changing a found group does not change the stored one', async () => {
      await repository.save(Group.create({ id: 'g1', name: 'Trip' }));

      const found = await repository.findById('g1');
      found?.addMember('ana');

      expect((await repository.findById('g1'))?.memberIds).toEqual([]);
    });
  });
}
