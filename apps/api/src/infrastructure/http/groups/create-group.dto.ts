import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  // Only the shape is checked here; length rules live in the domain (Group.create).
  // The limit is documented here for clients, but not enforced here.
  @ApiProperty({ maxLength: 60, description: 'Trimmed; must not be blank.' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
