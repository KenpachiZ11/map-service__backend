import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database').withTimeout(1500),
    ]);
  }
}
