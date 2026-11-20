import { ApiProperty } from '@nestjs/swagger';

// Documentation only: describes the error body that DomainExceptionFilter and Nest's
// ValidationPipe already send, so it never changes what the API returns.
export class ErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  // A domain error carries one message; the ValidationPipe lists one message per broken rule.
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message!: string | string[];
}
