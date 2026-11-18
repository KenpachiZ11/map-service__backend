import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LogAction } from './log-action.enum.js';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  action: LogAction;

  @Column({ nullable: true })
  login?: string;

  @Column({ nullable: true })
  actorLogin?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}