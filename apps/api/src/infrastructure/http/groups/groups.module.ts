import { Module } from '@nestjs/common';
import { GROUP_REPOSITORY, ID_GENERATOR } from '../../../application/ports/tokens';
import { AddMember } from '../../../application/use-cases/add-member';
import { CreateGroup } from '../../../application/use-cases/create-group';
import { GetGroup } from '../../../application/use-cases/get-group';
import { UuidIdGenerator } from '../../ids/uuid-id-generator';
import { PostgresGroupRepository } from '../../persistence/postgres/postgres-group.repository';
import { GroupsController } from './groups.controller';

// The composition root for groups: the only place that picks which adapter fills each port.
// It lives in infrastructure because it names concrete adapters; use cases never see them.
// Swapping Postgres for another store is a change to one `useClass` line below.
@Module({
  controllers: [GroupsController],
  providers: [
    CreateGroup,
    GetGroup,
    AddMember,
    { provide: GROUP_REPOSITORY, useClass: PostgresGroupRepository },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
  ],
})
export class GroupsModule {}
