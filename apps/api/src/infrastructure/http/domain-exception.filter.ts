import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import { GroupNotFoundError } from '../../application/errors/group-not-found.error';
import { InvalidBalancesError } from '../../domain/balances/invalid-balances.error';
import { InvalidExpenseError } from '../../domain/expenses/invalid-expense.error';
import { InvalidSplitError } from '../../domain/expenses/invalid-split.error';
import { DuplicateMemberError } from '../../domain/groups/duplicate-member.error';
import { InvalidGroupError } from '../../domain/groups/invalid-group.error';

// The only part of the Express response we use (avoids depending on Express types directly).
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/**
 * The one place that knows how domain and application errors become HTTP status codes, so the
 * domain stays free of HTTP and controllers stay free of try/catch.
 * Only the errors listed in @Catch are handled: anything else keeps Nest's default 500.
 */
@Catch(
  InvalidGroupError,
  InvalidExpenseError,
  InvalidSplitError,
  InvalidBalancesError,
  GroupNotFoundError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const status = statusFor(error);
    host.switchToHttp().getResponse<JsonResponse>().status(status).json({
      statusCode: status,
      error: REASONS[status],
      message: error.message,
    });
  }
}

// instanceof order matters: DuplicateMemberError is an InvalidGroupError, so check it first.
function statusFor(error: Error): number {
  if (error instanceof GroupNotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof DuplicateMemberError) return HttpStatus.CONFLICT;
  return HttpStatus.BAD_REQUEST;
}

const REASONS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
};
