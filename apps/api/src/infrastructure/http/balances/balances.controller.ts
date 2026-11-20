import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetBalances } from '../../../application/use-cases/get-balances';
import { GetSettlements } from '../../../application/use-cases/get-settlements';
import { ErrorResponse } from '../error-response';
import { BalancesResponse, SettlementsResponse } from './balances-response';

@ApiTags('balances')
@Controller('groups/:id')
export class BalancesController {
  constructor(
    private readonly getBalances: GetBalances,
    private readonly getSettlements: GetSettlements,
  ) {}

  @Get('balances')
  @ApiOperation({ operationId: 'getBalances' })
  @ApiOkResponse({ type: BalancesResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async balances(@Param('id') id: string): Promise<BalancesResponse> {
    return { currency: 'USD', balances: await this.getBalances.execute({ groupId: id }) };
  }

  @Get('settlements')
  @ApiOperation({ operationId: 'getSettlements' })
  @ApiOkResponse({ type: SettlementsResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async settlements(@Param('id') id: string): Promise<SettlementsResponse> {
    return { currency: 'USD', transfers: await this.getSettlements.execute({ groupId: id }) };
  }
}
