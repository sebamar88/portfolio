import { describe, expect, it } from 'vitest';
import { Group } from './group';
import { DuplicateMemberError } from './duplicate-member.error';
import { InvalidGroupError } from './invalid-group.error';

describe('Group', () => {
  it('is created with a trimmed name and no members', () => {
    const group = Group.create({ id: 'g1', name: '  Trip to Bariloche  ' });
    expect(group.id).toBe('g1');
    expect(group.name).toBe('Trip to Bariloche');
    expect(group.memberIds).toEqual([]);
  });

  it.each(['', '   ', 'x'.repeat(61)])('rejects an invalid name (%j)', (name) => {
    expect(() => Group.create({ id: 'g1', name })).toThrow(InvalidGroupError);
  });

  it('adds members in order', () => {
    const group = Group.create({ id: 'g1', name: 'Trip' });
    group.addMember('ana');
    group.addMember('bruno');
    expect(group.memberIds).toEqual(['ana', 'bruno']);
  });

  it('rejects adding the same member twice', () => {
    const group = Group.create({ id: 'g1', name: 'Trip' });
    group.addMember('ana');
    expect(() => group.addMember('ana')).toThrow('already a member');
    // A distinct type (still an InvalidGroupError) lets the HTTP layer answer 409 instead of 400.
    expect(() => group.addMember('ana')).toThrow(DuplicateMemberError);
    expect(() => group.addMember('ana')).toThrow(InvalidGroupError);
  });

  it('does not let callers change its members from outside', () => {
    const group = Group.create({ id: 'g1', name: 'Trip' });
    group.addMember('ana');
    // The returned list is read-only: the only way to add a member is addMember (which validates).
    expect(() => (group.memberIds as string[]).push('intruder')).toThrow(TypeError);
    expect(group.memberIds).toEqual(['ana']);
  });
});
