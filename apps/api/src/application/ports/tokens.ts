// Interfaces are erased at runtime, so Nest can't use them to find a dependency.
// These Symbols are the runtime keys that stand in for the ports.
export const GROUP_REPOSITORY = Symbol('GROUP_REPOSITORY');
export const ID_GENERATOR = Symbol('ID_GENERATOR');
