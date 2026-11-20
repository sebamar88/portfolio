import type { PushTokenStore } from '../ports/push';

export class RegisterPushToken {
  constructor(private readonly tokens: PushTokenStore) {}

  execute(groupId: string, token: string): Promise<void> {
    return this.tokens.add(groupId, token);
  }
}
