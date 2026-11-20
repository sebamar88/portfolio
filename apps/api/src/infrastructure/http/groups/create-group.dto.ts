import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  // Only the shape is checked here; length rules live in the domain (Group.create).
  @IsString()
  @IsNotEmpty()
  name!: string;
}
