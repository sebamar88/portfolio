import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { describe, expect, it } from 'vitest';
import type { HandleDomainEvent } from '../../src/application/use-cases/handle-domain-event';
import { DomainEventsProcessor } from '../../src/infrastructure/queue/domain-events.processor';
import { fakeEvent } from '../support/fakes';

function setup() {
  const handled: unknown[] = [];
  const handle = {
    async execute(event: unknown) {
      handled.push(event);
      return 'delivered';
    },
  } as unknown as HandleDomainEvent;
  return { processor: new DomainEventsProcessor(handle, { error() {} }), handled };
}

const job = (data: unknown) => ({ id: '1', data }) as Job;

describe('DomainEventsProcessor', () => {
  it('hands a valid event to the use case', async () => {
    const { processor, handled } = setup();
    const event = fakeEvent('expense.added');
    await processor.process(job(event));
    expect(handled).toEqual([event]);
  });

  it('fails an invalid event permanently (UnrecoverableError) without handling it', async () => {
    const { processor, handled } = setup();
    await expect(processor.process(job({ type: 'nope' }))).rejects.toBeInstanceOf(UnrecoverableError);
    expect(handled).toEqual([]);
  });

  it('lets use case failures propagate as normal (retryable) errors', async () => {
    const processor = new DomainEventsProcessor(
      { execute: async () => { throw new Error('boom'); } } as unknown as HandleDomainEvent,
      { error() {} },
    );
    const error = await processor.process(job(fakeEvent('expense.added'))).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(UnrecoverableError);
  });
});
