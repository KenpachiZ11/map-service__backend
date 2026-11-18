import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../user/user-role.enum.js';
import { Log } from './log.entity.js';
import { LogsService } from './logs.service.js';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Roles(UserRole.Admin, UserRole.Manager)
  @Get()
  @ApiOperation({ summary: 'Журнал действий пользователей' })
  findAll(): Promise<Log[]> {
    return this.logs.findAll();
  }
}