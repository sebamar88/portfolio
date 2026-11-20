import { ApiProperty } from '@nestjs/swagger';

export class MemberBalanceResponse {
  @ApiProperty()
  memberId!: string;

  @ApiProperty({ type: 'integer', description: 'Cents. Positive: is owed money. Negative: owes money.' })
  amount!: number;
}

export class BalancesResponse {
  @ApiProperty({ enum: ['USD'] })
  currency!: 'USD';

  @ApiProperty({ type: [MemberBalanceResponse], description: 'One entry per member, in the order they joined.' })
  balances!: MemberBalanceResponse[];
}

export class TransferResponse {
  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({ type: 'integer', description: 'Cents, always more than 0.' })
  amount!: number;
}

export class SettlementsResponse {
  @ApiProperty({ enum: ['USD'] })
  currency!: 'USD';

  @ApiProperty({ type: [TransferResponse] })
  transfers!: TransferResponse[];
}
