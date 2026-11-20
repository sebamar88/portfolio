import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AddMember } from '../../../application/use-cases/add-member';
import { CreateGroup } from '../../../application/use-cases/create-group';
import { GetGroup } from '../../../application/use-cases/get-group';
import { AddMemberDto } from './add-member.dto';
import { CreateGroupDto } from './create-group.dto';
import { ErrorResponse } from '../error-response';
import { GroupResponse, toGroupResponse } from './group-response';

// Thin on purpose: translate HTTP in and out, delegate everything else to the use cases.
// Errors are not caught here; DomainExceptionFilter maps them to status codes.
// The @Api* decorators only document; operationId becomes the client's method name, so keep it stable.
@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly createGroup: CreateGroup,
    private readonly getGroup: GetGroup,
    private readonly addMember: AddMember,
  ) {}

  @Post()
  @ApiOperation({ operationId: 'createGroup' })
  @ApiCreatedResponse({ type: GroupResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async create(@Body() dto: CreateGroupDto) {
    return toGroupResponse(await this.createGroup.execute({ name: dto.name }));
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getGroup' })
  @ApiOkResponse({ type: GroupResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async get(@Param('id') id: string) {
    return toGroupResponse(await this.getGroup.execute({ groupId: id }));
  }

  @Post(':id/members')
  @ApiOperation({ operationId: 'addMember' })
  @ApiCreatedResponse({ type: GroupResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiConflictResponse({ type: ErrorResponse })
  async add(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return toGroupResponse(await this.addMember.execute({ groupId: id, memberId: dto.memberId }));
  }
}
