import { expenseRepositoryContract } from '../../application/ports/expense-repository.contract';
import { InMemoryExpenseRepository } from './in-memory-expense.repository';
import { InMemoryGroupRepository } from './in-memory-group.repository';

expenseRepositoryContract('in-memory', () => ({
  groups: new InMemoryGroupRepository(),
  expenses: new InMemoryExpenseRepository(),
}));
