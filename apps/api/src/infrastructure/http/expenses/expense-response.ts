import { ApiProperty } from '@nestjs/swagger';
import type { Expense } from '../../../domain/expenses/expense';

// Money leaves the API as integer cents plus an explicit currency, never as a float.
export class ShareResponse {
  @ApiProperty()
  memberId!: string;

  @ApiProperty({ type: 'integer', description: 'Cents.' })
  amount!: number;
}

export class ExpenseResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: 'integer', description: 'Cents.', example: 1250 })
  amount!: number;

  @ApiProperty({ enum: ['USD'] })
  currency!: 'USD';

  @ApiProperty()
  payerId!: string;

  @ApiProperty({ type: [ShareResponse] })
  shares!: ShareResponse[];

  @ApiProperty({ example: '2026-05-20', description: 'YYYY-MM-DD.' })
  paidAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class ExpensePageResponse {
  @ApiProperty({ type: [ExpenseResponse] })
  items!: ExpenseResponse[];

  @ApiProperty({ type: String, nullable: true, description: 'Pass as `cursor` to get the next page; null on the last page.' })
  nextCursor!: string | null;
}

export function toExpenseResponse(expense: Expense): ExpenseResponse {
  return {
    id: expense.id,
    groupId: expense.groupId,
    description: expense.description,
    amount: expense.total,
    currency: 'USD',
    payerId: expense.payerId,
    shares: expense.shares.map((share) => ({ memberId: share.memberId, amount: share.amount })),
    paidAt: expense.paidAt,
    // Stored expenses always have it; only a not-yet-saved one can be missing it.
    createdAt: expense.createdAt!.toISOString(),
  };
}
