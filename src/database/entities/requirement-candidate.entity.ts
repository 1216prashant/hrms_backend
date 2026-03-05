import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';
import { Candidate } from './candidate.entity';
import { CandidateStage } from './candidate-stage.entity';
import { RequirementCandidateComment } from './requirement-candidate-comment.entity';

export enum RequirementCandidateStatus {
  ACTIVE = 'ACTIVE',
  IN_PROCESS = 'IN_PROCESS',
  SELECTED = 'SELECTED',
  JOINED = 'JOINED',
  REJECTED = 'REJECTED',
  DROPPED = 'DROPPED',
  ABSCONDED = 'ABSCONDED',
}

@Entity('requirement_candidates')
export class RequirementCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @ManyToOne(() => CandidateStage, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stage_id' })
  stage: CandidateStage;

  @OneToMany(() => RequirementCandidateComment, (c) => c.requirementCandidate)
  comments: RequirementCandidateComment[];

  @Column({
    name: 'offered_ctc',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  offeredCtc: number | null;

  @Column({
    name: 'final_ctc',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  finalCtc: number | null;

  @Column({ name: 'joining_date', type: 'date', nullable: true })
  joiningDate: Date | null;

  @Column({
    type: 'enum',
    enum: RequirementCandidateStatus,
    nullable: true,
  })
  status: RequirementCandidateStatus | null;

  @Column({
    name: 'replacement_flag',
    type: 'tinyint',
    width: 1,
    default: 0,
    nullable: true,
  })
  replacementFlag: number | null;

  @Column({ name: 'replacement_due_date', type: 'date', nullable: true })
  replacementDueDate: Date | null;

  // @Column({ name: 'remarks', type: 'text', nullable: true })
  // remarks: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
