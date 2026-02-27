import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WorkType {
  FULL_TIME = 'FULL-TIME',
  PART_TIME = 'PART-TIME',
}

export enum EmploymentType {
  PERMANENT = 'PERMANENT',
  CONTRACTUAL = 'CONTRACTUAL',
}

export enum WorkMode {
  WFH = 'WFH',
  WFO = 'WFO',
  HYBRID = 'HYBRID',
}

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ length: 150, nullable: true, name: 'industry' })
  industry: string | null;

  
  @Column({ length: 150, nullable: true, name: 'domain' })
  domain: string | null;
  
  @Column({ length: 150, nullable: true, name: 'sub_domain' })
  subDomain: string | null;

  @Column({ length: 150, nullable: true })
  source: string | null;

  @Column({ type: 'longtext', nullable: true })
  skills: string | null;

  @Column({ name: 'highest_education', length: 150, nullable: true })
  highestEducation: string | null;

  @Column({ name: 'current_position', length: 150, nullable: true })
  currentPosition: string | null;

  @Column({ name: 'notice_period', length: 150, nullable: true })
  noticePeriod: string | null;

  @Column({
    name: 'experience_years',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  experienceYears: number | null;

  @Column({ name: 'current_company', length: 150, nullable: true })
  currentCompany: string | null;

  @Column({
    name: 'work_type',
    type: 'enum',
    enum: WorkType,
    nullable: true,
  })
  workType: WorkType | null;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
    nullable: true,
  })
  employmentType: EmploymentType | null;

  @Column({
    name: 'work_mode',
    type: 'enum',
    enum: WorkMode,
    nullable: true,
  })
  workMode: WorkMode | null;

  @Column({
    name: 'current_ctc',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  currentCtc: number | null;

  @Column({
    name: 'expected_ctc',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  expectedCtc: number | null;

  @Column({ name: 'cv_url', type: 'text', nullable: true })
  cvUrl: string | null;

  
  @Column({ name: 'hr_remarks', length: 255, nullable: true })
  hrRemarks: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
