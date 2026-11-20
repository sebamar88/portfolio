import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { EVENTS_QUEUE, InvalidEventError, parseEvent } from '@portfolio/events';
import type { DomainEvent } from '@portfolio/events';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { HandleDomainEvent, errorMessage } from '../../application/use-cases/handle-domain-event';

export const PROCESSOR_LOGGER = Symbol('PROCESSOR_LOGGER');

@Processor(EVENTS_QUEUE)
export class DomainEventsProcessor extends WorkerHost {
  constructor(
    private readonly handleDomainEvent: HandleDomainEvent,
    @Inject(PROCESSOR_LOGGER) private readonly logger: Pick<Logger, 'error'>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    let event: DomainEvent;
    try {
      event = parseEvent(job.data);
    } catch (error) {
      if (!(error instanceof InvalidEventError)) throw error;
      this.logger.error(`Dropping invalid event in job ${job.id}: ${error.message}`);
      // UnrecoverableError skips the remaining attempts: retrying malformed data can't help.
      throw new UnrecoverableError(error.message);
    }
    await this.handleDomainEvent.execute(event);
  }

  // BullMQ workers are EventEmitters: an 'error' with no listener would crash the process
  // (this is what fires while Redis is unreachable; the worker keeps reconnecting by itself).
  @OnWorkerEvent('error')
  onError(error: Error) {
    Logger.warn(`Worker error: ${error.message}`, DomainEventsProcessor.name);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    Logger.warn(
      `Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}): ${errorMessage(error)}`,
      DomainEventsProcessor.name,
    );
  }
}
