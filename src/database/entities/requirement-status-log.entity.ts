import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Requirement, RequirementStatus } from './requirement.entity';
import { User } from './user.entity';

@Entity('requirement_status_logs')
export class RequirementStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @Column({
    name: 'old_status',
    type: 'enum',
    enum: RequirementStatus,
    nullable: true,
  })
  oldStatus: RequirementStatus | null;

  @Column({
    name: 'new_status',
    type: 'enum',
    enum: RequirementStatus,
  })
  newStatus: RequirementStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy: User | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
