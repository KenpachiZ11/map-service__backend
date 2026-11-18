import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator.js';
import { AppService, type AppInfo } from './app.service.js';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Информация о сервисе' })
  @ApiOkResponse({ description: 'Базовая информация о работающем сервисе' })
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }
}
