import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Cheap liveness probe for load balancers / CI: no dependencies, so it only fails if the process is broken.
  @Get()
  check() {
    return { status: 'ok' };
  }
}
