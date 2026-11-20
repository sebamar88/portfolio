/** Port: creates ids for new entities. Injected so tests can use predictable ids. */
export interface IdGenerator {
  next(): string;
}
