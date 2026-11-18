import { IsOptional } from 'class-validator';
import type { UserAccess } from '../user.entity.js';

export class UpdateAccessDto {
  @IsOptional()
  access?: UserAccess;
}
