/** Remembers which event ids were already notified, so retries and duplicates never notify twice. */
export interface ProcessedEvents {
  /** Atomically claims the id. Returns false when someone already claimed it. */
  claim(eventId: string): Promise<boolean>;
  /** Gives the claim back (used when delivery failed, so a retry may deliver). */
  release(eventId: string): Promise<void>;
}
