import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RequirementCandidate } from './requirement-candidate.entity';
import { User } from './user.entity';

export enum CommentType {
  GENERAL = 'GENERAL',
  INTERVIEW_FEEDBACK = 'INTERVIEW_FEEDBACK',
  OFFER_UPDATE = 'OFFER_UPDATE',
  SYSTEM = 'SYSTEM',
  REPLACEMENT_TRIGGER = 'REPLACEMENT_TRIGGER',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export enum EventReason {
  RESIGNED = 'RESIGNED',
  ABSCONDED = 'ABSCONDED',
  TERMINATED = 'TERMINATED',
  CLIENT_REJECTED_AFTER_JOIN = 'CLIENT_REJECTED_AFTER_JOIN',
}

@Entity('requirement_candidate_comments')
export class RequirementCandidateComment {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @ManyToOne(() => RequirementCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_candidate_id' })
  requirementCandidate: RequirementCandidate;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  comment: string;

  @Column({
    name: 'comment_type',
    type: 'enum',
    enum: CommentType,
    default: CommentType.GENERAL,
    nullable: true,
  })
  commentType: CommentType | null;

  @Column({
    name: 'event_reason',
    type: 'enum',
    enum: EventReason,
    nullable: true,
  })
  eventReason: EventReason | null;

  @Column({ name: 'is_internal', type: 'tinyint', width: 1, default: 1, nullable: true })
  isInternal: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
