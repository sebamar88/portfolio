import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddExpenseDto {
  // Only the shape is checked here; the rules live in the domain and in parseAmount.
  @ApiProperty({ maxLength: 120, description: 'Trimmed; must not be blank.' })
  @IsString()
  description!: string;

  // A string, not a number: JSON floats can't represent money exactly (see money.ts).
  @ApiProperty({ example: '12.50', description: 'Decimal text in USD with at most 2 decimals.' })
  @IsString()
  amount!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payerId!: string;

  @ApiPropertyOptional({ type: [String], description: 'Members who share the cost. Defaults to every member.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @ApiProperty({ example: '2026-05-20', description: 'Day it was paid, as YYYY-MM-DD.' })
  @IsString()
  paidAt!: string;
}
