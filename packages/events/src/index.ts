import { z } from 'zod';

// Contract between the core API (publisher) and the real-time service (consumer).
// Bump EVENT_VERSION (and keep parsing the old one) when an envelope changes incompatibly.
export const EVENT_VERSION = 1;

/** BullMQ queue the core API publishes domain events to. */
export const EVENTS_QUEUE = 'domain-events';

/**
 * Job options publishers should use when enqueuing an event, so every producer gets the same
 * retry policy: 5 attempts, exponential backoff (1s, 2s, 4s, 8s). Use `jobId: event.id` too, so
 * enqueuing the same event twice is a no-op at the queue level.
 */
export const EVENT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
} as const;

/** Socket.IO room that every client interested in a group joins. */
export function groupRoom(groupId: string): string {
  return `group:${groupId}`;
}

const nonEmpty = z.string().min(1);

const envelope = {
  id: z.uuid(),
  version: z.literal(EVENT_VERSION),
  occurredAt: z.iso.datetime({ offset: true }),
  groupId: nonEmpty,
};

export const groupMemberAddedSchema = z.object({
  ...envelope,
  type: z.literal('group.member_added'),
  payload: z.object({ memberId: nonEmpty }),
});

export const expenseAddedSchema = z.object({
  ...envelope,
  type: z.literal('expense.added'),
  payload: z.object({
    expenseId: nonEmpty,
    description: nonEmpty,
    /** Amount in cents (integer). */
    amount: z.number().int().nonnegative(),
    /** ISO 4217 code, e.g. "USD". */
    currency: z.string().length(3),
    payerId: nonEmpty,
    participantIds: z.array(nonEmpty),
  }),
});

export const domainEventSchema = z.discriminatedUnion('type', [
  groupMemberAddedSchema,
  expenseAddedSchema,
]);

export type GroupMemberAddedEvent = z.infer<typeof groupMemberAddedSchema>;
export type ExpenseAddedEvent = z.infer<typeof expenseAddedSchema>;
export type DomainEvent = z.infer<typeof domainEventSchema>;
export type DomainEventType = DomainEvent['type'];

export class InvalidEventError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid domain event: ${issues.join('; ')}`);
    this.name = 'InvalidEventError';
    this.issues = issues;
  }
}

/** Validates an unknown value (e.g. a job's data) and returns the typed event, or throws InvalidEventError. */
export function parseEvent(input: unknown): DomainEvent {
  const result = domainEventSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidEventError(
      result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    );
  }
  return result.data;
}
