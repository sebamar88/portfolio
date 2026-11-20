import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  memberId!: string;
}
