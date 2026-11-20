import { describe, expect, it } from 'vitest';
import {
  EVENTS_QUEUE,
  InvalidEventError,
  groupRoom,
  parseEvent,
} from '../src/index';

const base = {
  id: '0b8f1a3e-8f7e-4a53-9a43-2b7d3b5a6c11',
  version: 1,
  occurredAt: '2025-01-15T10:00:00.000Z',
  groupId: 'g1',
};
const memberAdded = { ...base, type: 'group.member_added', payload: { memberId: 'm1' } };
const expenseAdded = {
  ...base,
  type: 'expense.added',
  payload: {
    expenseId: 'e1',
    description: 'Dinner',
    amount: 4599,
    currency: 'USD',
    payerId: 'Ana',
    participantIds: ['Ana', 'Bob'],
  },
};

describe('parseEvent', () => {
  it('accepts a valid group.member_added event', () => {
    expect(parseEvent(memberAdded)).toEqual(memberAdded);
  });

  it('accepts a valid expense.added event', () => {
    expect(parseEvent(expenseAdded)).toEqual(expenseAdded);
  });

  it('rejects an unknown event type', () => {
    expect(() => parseEvent({ ...memberAdded, type: 'group.deleted' })).toThrow(InvalidEventError);
  });

  it('rejects a version mismatch', () => {
    expect(() => parseEvent({ ...memberAdded, version: 2 })).toThrow(InvalidEventError);
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['a non-uuid id', { ...memberAdded, id: '123' }],
    ['a bad timestamp', { ...memberAdded, occurredAt: 'yesterday' }],
    ['an empty groupId', { ...memberAdded, groupId: '' }],
    ['a missing payload field', { ...memberAdded, payload: {} }],
    ['a fractional amount', { ...expenseAdded, payload: { ...expenseAdded.payload, amount: 1.5 } }],
    ['a bad currency', { ...expenseAdded, payload: { ...expenseAdded.payload, currency: 'DOLLARS' } }],
  ])('rejects %s', (_name, input) => {
    expect(() => parseEvent(input)).toThrow(InvalidEventError);
  });

  it('reports the failing field paths in the error', () => {
    try {
      parseEvent({ ...memberAdded, payload: {} });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEventError);
      expect((error as InvalidEventError).issues[0]).toContain('payload.memberId');
    }
  });
});

describe('constants and helpers', () => {
  it('exposes the queue name and room helper', () => {
    expect(EVENTS_QUEUE).toBe('domain-events');
    expect(groupRoom('g1')).toBe('group:g1');
  });
});
