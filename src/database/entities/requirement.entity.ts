import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { ClientSpoc } from "./client-spoc.entity";
import { Client } from "./client.entity";
import { User } from "./user.entity";

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
  
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'job_title' })
    jobTitle: string;

    
    @Column({ name: 'industry' })
    industry: string;
  
    @Column({ type: 'text', nullable: true, name: 'job_description' })
    jobDescription: string;
  
    @Column({ name: 'total_positions' })
    totalPositions: number;
  
    @Column({ type: 'enum', enum: BillingModel, name: 'billing_model' })
    billingModel: BillingModel;
  
    @Column({ type: 'decimal', nullable: true, name: 'fixed_fee' })
    fixedFee: number;
  
    @Column({ type: 'decimal', nullable: true , name:'percentage_fee'})
    percentageFee: number;
  
    @Column({ default: 0, name: 'replacement_days' })
    replacementDays: number;
  
    @Column({ type: 'enum', enum: RequirementStatus, name: 'status' })
    status: RequirementStatus;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    
    @ManyToOne(() => Client, client => client.requirements)
    @JoinColumn({ name: 'client_id' })
    client: Client;
  
    @ManyToOne(() => ClientSpoc, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'spoc_id' })
    spoc: ClientSpoc;
  
    @ManyToOne(() => User, user => user.requirements, { nullable: true })
    @JoinColumn({ name: 'assigned_hr_id' })
    assignedHr: User;
  }