import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ExpensesModule } from './infrastructure/http/expenses/expenses.module';
import { GroupsModule } from './infrastructure/http/groups/groups.module';
import { HealthModule } from './health/health.module';

@Module({ imports: [DatabaseModule, HealthModule, GroupsModule, ExpensesModule] })
export class AppModule {}
