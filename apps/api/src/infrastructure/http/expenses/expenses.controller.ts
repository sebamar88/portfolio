import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddExpense } from '../../../application/use-cases/add-expense';
import { ListExpenses } from '../../../application/use-cases/list-expenses';
import { ErrorResponse } from '../error-response';
import { parseAmount } from '../money';
import { AddExpenseDto } from './add-expense.dto';
import { ExpensePageResponse, ExpenseResponse, toExpenseResponse } from './expense-response';
import { ListExpensesQuery } from './list-expenses.query';

// Thin like GroupsController: the only logic here is the money conversion at the HTTP border.
@ApiTags('expenses')
@Controller('groups/:id/expenses')
export class ExpensesController {
  constructor(
    private readonly addExpense: AddExpense,
    private readonly listExpenses: ListExpenses,
  ) {}

  @Post()
  @ApiOperation({ operationId: 'addExpense' })
  @ApiCreatedResponse({ type: ExpenseResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async add(@Param('id') id: string, @Body() dto: AddExpenseDto) {
    const expense = await this.addExpense.execute({
      groupId: id,
      description: dto.description,
      amount: parseAmount(dto.amount),
      payerId: dto.payerId,
      participantIds: dto.participantIds,
      paidAt: dto.paidAt,
    });
    return toExpenseResponse(expense);
  }

  @Get()
  @ApiOperation({ operationId: 'listExpenses' })
  @ApiOkResponse({ type: ExpensePageResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async list(@Param('id') id: string, @Query() query: ListExpensesQuery): Promise<ExpensePageResponse> {
    const page = await this.listExpenses.execute({ groupId: id, limit: query.limit, cursor: query.cursor });
    return { items: page.items.map(toExpenseResponse), nextCursor: page.nextCursor };
  }
}
