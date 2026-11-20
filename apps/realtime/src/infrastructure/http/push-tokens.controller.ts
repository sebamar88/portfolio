import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { RegisterPushToken } from '../../application/use-cases/register-push-token';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @Matches(/^Expo(nent)?PushToken\[.+\]$/, { message: 'token must be an Expo push token' })
  token!: string;
}

@Controller('push-tokens')
export class PushTokensController {
  constructor(private readonly registerPushToken: RegisterPushToken) {}

  @Post()
  @HttpCode(204)
  async register(@Body() dto: RegisterPushTokenDto): Promise<void> {
    await this.registerPushToken.execute(dto.groupId, dto.token);
  }
}
