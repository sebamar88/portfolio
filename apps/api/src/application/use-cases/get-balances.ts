import { Inject, Injectable } from '@nestjs/common';
import { computeBalances } from '../../domain/balances/compute-balances';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import type { ExpenseRepository } from '../ports/expense-repository';
import type { GroupRepository } from '../ports/group-repository';
import { EXPENSE_REPOSITORY, GROUP_REPOSITORY } from '../ports/tokens';

export interface MemberBalance {
  memberId: string;
  /** Integer cents: positive = is owed money, negative = owes money. */
  amount: number;
}

@Injectable()
export class GetBalances {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
  ) {}

  async execute(input: { groupId: string }): Promise<MemberBalance[]> {
    const group = await this.groups.findById(input.groupId);
    if (!group) throw new GroupNotFoundError(input.groupId);

    const balances = computeBalances(await this.expenses.findAllByGroup(group.id));
    // computeBalances only knows members who appear in an expense; clients want everyone, in member order.
    return group.memberIds.map((memberId) => ({ memberId, amount: balances[memberId] ?? 0 }));
  }
}
