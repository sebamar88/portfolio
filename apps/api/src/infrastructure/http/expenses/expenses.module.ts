import { Module } from '@nestjs/common';
import { CLOCK, EXPENSE_REPOSITORY } from '../../../application/ports/tokens';
import { AddExpense } from '../../../application/use-cases/add-expense';
import { GetBalances } from '../../../application/use-cases/get-balances';
import { GetSettlements } from '../../../application/use-cases/get-settlements';
import { ListExpenses } from '../../../application/use-cases/list-expenses';
import { PostgresExpenseRepository } from '../../persistence/postgres/postgres-expense.repository';
import { SystemClock } from '../../time/system-clock';
import { GroupsModule } from '../groups/groups.module';
import { BalancesController } from '../balances/balances.controller';
import { ExpensesController } from './expenses.controller';

// Composition root for expenses and the balances derived from them (see GroupsModule).
// GroupsModule exports the group repository and id generator, so there is one adapter for each.
@Module({
  imports: [GroupsModule],
  controllers: [ExpensesController, BalancesController],
  providers: [
    AddExpense,
    ListExpenses,
    GetBalances,
    GetSettlements,
    { provide: EXPENSE_REPOSITORY, useClass: PostgresExpenseRepository },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class ExpensesModule {}
