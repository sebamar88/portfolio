import { Inject, Injectable } from '@nestjs/common';
import { computeBalances } from '../../domain/balances/compute-balances';
import { settleDebts, type Transfer } from '../../domain/balances/settle-debts';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import type { ExpenseRepository } from '../ports/expense-repository';
import type { GroupRepository } from '../ports/group-repository';
import { EXPENSE_REPOSITORY, GROUP_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetSettlements {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
  ) {}

  async execute(input: { groupId: string }): Promise<Transfer[]> {
    const group = await this.groups.findById(input.groupId);
    if (!group) throw new GroupNotFoundError(input.groupId);
    return settleDebts(computeBalances(await this.expenses.findAllByGroup(group.id)));
  }
}
