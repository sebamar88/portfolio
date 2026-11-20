/** Port: the current time. Injected so tests can pin it. */
export interface Clock {
  now(): Date;
}
