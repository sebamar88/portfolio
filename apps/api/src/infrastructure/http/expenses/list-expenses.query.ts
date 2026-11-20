import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListExpensesQuery {
  // Query values arrive as text, so @Type converts to a number before @IsInt checks it.
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque value from `nextCursor` of the previous page.' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
