import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAction } from './log-action.enum.js';
import { Log } from './log.entity.js';

export interface CreateLogInput {
  action: LogAction;
  login?: string;
  actorLogin?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class LogsService {
  constructor(@InjectRepository(Log) private readonly logs: Repository<Log>) {}

  async create(input: CreateLogInput): Promise<void> {
    try {
      await this.logs.save(
        this.logs.create({
          action: input.action,
          login: input.login,
          actorLogin: input.actorLogin,
          details: input.details,
        }),
      );
    } catch {
      // Журнал не должен ломать основное действие.
    }
  }

  findAll(): Promise<Log[]> {
    return this.logs.find({ order: { createdAt: 'DESC' } });
  }
}