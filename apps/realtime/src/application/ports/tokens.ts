// Interfaces are erased at runtime, so Nest can't use them to find a dependency.
// These Symbols are the runtime keys that stand in for the ports.
export const NOTIFICATION_PUBLISHER = Symbol('NOTIFICATION_PUBLISHER');
export const PROCESSED_EVENTS = Symbol('PROCESSED_EVENTS');
export const PUSH_SENDER = Symbol('PUSH_SENDER');
export const PUSH_TOKEN_STORE = Symbol('PUSH_TOKEN_STORE');
export const REDIS = Symbol('REDIS');
export const APP_CONFIG = Symbol('APP_CONFIG');
