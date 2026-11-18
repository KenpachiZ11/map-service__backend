import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum.js';

export type UserAccess = boolean | string[];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.User })
  role: UserRole;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Exclude()
  @Column()
  password: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  access: UserAccess;
}
