import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Type } from 'class-transformer';
import { ClientSpoc } from './client-spoc.entity';
import { Client } from './client.entity';
import { User } from './user.entity';
import { EmploymentType, WorkMode } from './candidate.entity';

export enum BillingModel {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum RequirementStatus {
  OPEN = 'OPEN',
  PARTIALLY_CLOSED = 'PARTIALLY_CLOSED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, (client) => client.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => ClientSpoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spoc_id' })
  spoc: ClientSpoc;

  @Column({ name: 'job_title', length: 255 })
  jobTitle: string;

  @Column({ type: 'text', nullable: true, name: 'job_description' })
  jobDescription: string | null;

  @Column({ name: 'industry', length: 150, nullable: true })
  industry: string | null;

  @Column({ name: 'primary_skills', length: 150, nullable: true })
  primarySkills: string | null;

  @Column({ name: 'total_positions' })
  totalPositions: number;

  @Column()
  budget: number;

  @Column({ length: 50, default: '' })
  location: string;

  @Column({ name: 'pg_percentage', length: 50, default: '' })
  pgPercentage: string;

  @Column({ name: 'ug_percentage', length: 50, default: '' })
  ugPercentage: string;

  @Column({ name: 'ssc_percentage', length: 50, default: '' })
  sscPercentage: string;

  @Column({ length: 50, default: '' })
  gender: string;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.PERMANENT,
  })
  employmentType: EmploymentType;

  @Column({
    name: 'work_mode',
    type: 'enum',
    enum: WorkMode,
    default: WorkMode.WFO,
  })
  workMode: WorkMode;

  @Column({ length: 50, default: '' })
  experience: string;

  @Column({ name: 'joining_period', type: 'int', unsigned: true, nullable: true })
  joiningPeriod: number | null;

  @Column({ name: 'jd_url', type: 'text', nullable: true })
  jdUrl: string | null;

  @ManyToOne(() => User, (user) => user.requirements, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_hr_id' })
  @Type(() => User)
  assignedHr: User | null;

  @Column({ type: 'enum', enum: BillingModel, name: 'billing_model' })
  billingModel: BillingModel;

  @Column({
    name: 'fixed_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  fixedFee: number | null;

  @Column({
    name: 'percentage_fee',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  percentageFee: number | null;

  @Column({ name: 'clawback_period', type: 'int', default: 90, nullable: true })
  clawbackPeriod: number | null;

  @Column({ name: 'replacement_days', type: 'int', default: 90 })
  replacementDays: number;

  
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'enum', enum: RequirementStatus })
  status: RequirementStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}