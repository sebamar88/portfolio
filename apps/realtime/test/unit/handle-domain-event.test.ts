import { describe, expect, it } from 'vitest';
import { HandleDomainEvent } from '../../src/application/use-cases/handle-domain-event';
import type { Notification } from '../../src/domain/notification';
import { InMemoryProcessedEvents, fakeEvent } from '../support/fakes';

function setup(overrides: { publish?: (n: Notification) => void | Promise<void> } = {}) {
  const published: Notification[] = [];
  const pushed: { tokens: string[]; notification: Notification }[] = [];
  const processed = new InMemoryProcessedEvents();
  const tokens = new Map<string, string[]>();
  const useCase = new HandleDomainEvent({
    processedEvents: processed,
    publisher: {
      async publish(n) {
        await overrides.publish?.(n);
        published.push(n);
      },
    },
    pushTokens: {
      async add() {},
      async list(groupId) {
        return tokens.get(groupId) ?? [];
      },
    },
    pushSender: {
      async send(t, n) {
        pushed.push({ tokens: t, notification: n });
      },
    },
    logger: { warn() {} },
  });
  return { useCase, published, pushed, processed, tokens };
}

describe('HandleDomainEvent', () => {
  it('maps expense.added to a notification', async () => {
    const { useCase, published } = setup();
    const event = fakeEvent('expense.added');
    await useCase.execute(event);
    expect(published).toEqual([
      {
        type: 'expense.added',
        groupId: 'g1',
        title: 'New expense',
        body: 'Ana added Dinner ($45.99)',
        event,
      },
    ]);
  });

  it('maps group.member_added to a notification', async () => {
    const { useCase, published } = setup();
    const event = fakeEvent('group.member_added');
    await useCase.execute(event);
    expect(published).toEqual([
      {
        type: 'group.member_added',
        groupId: 'g1',
        title: 'New member',
        body: 'Bob joined the group',
        event,
      },
    ]);
  });

  it('publishes once when the same event id is handled twice', async () => {
    const { useCase, published } = setup();
    const event = fakeEvent('expense.added');
    expect(await useCase.execute(event)).toBe('delivered');
    expect(await useCase.execute({ ...event })).toBe('duplicate');
    expect(published).toHaveLength(1);
  });

  it('releases the claim when publishing fails so a retry can deliver', async () => {
    let failures = 2;
    const { useCase, published } = setup({
      publish() {
        if (failures-- > 0) throw new Error('socket down');
      },
    });
    const event = fakeEvent('expense.added');
    await expect(useCase.execute(event)).rejects.toThrow('socket down');
    await expect(useCase.execute(event)).rejects.toThrow('socket down');
    expect(await useCase.execute(event)).toBe('delivered');
    expect(published).toHaveLength(1);
  });

  it('sends a push to every token registered for the group', async () => {
    const { useCase, pushed, tokens } = setup();
    tokens.set('g1', ['ExponentPushToken[a]', 'ExponentPushToken[b]']);
    await useCase.execute(fakeEvent('expense.added'));
    expect(pushed).toHaveLength(1);
    expect(pushed[0]?.tokens).toEqual(['ExponentPushToken[a]', 'ExponentPushToken[b]']);
  });

  it('does not call the push sender when no tokens are registered', async () => {
    const { useCase, pushed } = setup();
    await useCase.execute(fakeEvent('expense.added'));
    expect(pushed).toEqual([]);
  });

  it('does not fail (or re-notify) when the push sender fails', async () => {
    const warnings: string[] = [];
    const published: Notification[] = [];
    const useCase = new HandleDomainEvent({
      processedEvents: new InMemoryProcessedEvents(),
      publisher: { async publish(n) { published.push(n); } },
      pushTokens: { async add() {}, async list() { return ['ExponentPushToken[a]']; } },
      pushSender: { async send() { throw new Error('expo 500'); } },
      logger: { warn: (m) => warnings.push(m) },
    });
    await expect(useCase.execute(fakeEvent('expense.added'))).resolves.toBe('delivered');
    expect(published).toHaveLength(1);
    expect(warnings[0]).toContain('expo 500');
  });
});
