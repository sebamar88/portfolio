import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// One module per feature keeps the app splittable as it grows.
@Module({ controllers: [HealthController] })
export class HealthModule {}
