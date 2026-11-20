import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddMember } from '../../../application/use-cases/add-member';
import { CreateGroup } from '../../../application/use-cases/create-group';
import { GetGroup } from '../../../application/use-cases/get-group';
import { AddMemberDto } from './add-member.dto';
import { CreateGroupDto } from './create-group.dto';
import { toGroupResponse } from './group-response';

// Thin on purpose: translate HTTP in and out, delegate everything else to the use cases.
// Errors are not caught here; DomainExceptionFilter maps them to status codes.
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly createGroup: CreateGroup,
    private readonly getGroup: GetGroup,
    private readonly addMember: AddMember,
  ) {}

  @Post()
  async create(@Body() dto: CreateGroupDto) {
    return toGroupResponse(await this.createGroup.execute({ name: dto.name }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return toGroupResponse(await this.getGroup.execute({ groupId: id }));
  }

  @Post(':id/members')
  async add(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return toGroupResponse(await this.addMember.execute({ groupId: id, memberId: dto.memberId }));
  }
}
