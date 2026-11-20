import { Inject, Injectable } from '@nestjs/common';
import { Expense } from '../../domain/expenses/expense';
import { splitEqually } from '../../domain/expenses/split-equally';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { NotGroupMemberError } from '../errors/not-group-member.error';
import type { Clock } from '../ports/clock';
import type { ExpenseRepository } from '../ports/expense-repository';
import type { GroupRepository } from '../ports/group-repository';
import type { IdGenerator } from '../ports/id-generator';
import { CLOCK, EXPENSE_REPOSITORY, GROUP_REPOSITORY, ID_GENERATOR } from '../ports/tokens';

@Injectable()
export class AddExpense {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: {
    groupId: string;
    description: string;
    /** Integer cents. */
    amount: number;
    payerId: string;
    /** Defaults to every member of the group. */
    participantIds?: string[];
    paidAt: string;
  }): Promise<Expense> {
    const group = await this.groups.findById(input.groupId);
    if (!group) throw new GroupNotFoundError(input.groupId);

    // Only the group knows who belongs to it, so this check cannot live in the Expense domain.
    const participantIds = input.participantIds ?? [...group.memberIds];
    for (const memberId of [input.payerId, ...participantIds]) {
      if (!group.memberIds.includes(memberId)) throw new NotGroupMemberError(memberId);
    }

    const expense = Expense.create({
      id: this.ids.next(),
      groupId: group.id,
      description: input.description,
      paidAt: input.paidAt,
      createdAt: this.clock.now(),
      payerId: input.payerId,
      total: input.amount,
      shares: splitEqually(input.amount, participantIds),
    });
    await this.expenses.save(expense);
    return expense;
  }
}
