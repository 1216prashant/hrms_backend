import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';

export enum AgreementType {
  CONTINGENCY = 'CONTINGENCY',
  RETAINER = 'RETAINER',
  CONTRACTUAL = 'CONTRACTUAL',
}

export enum AgreementBillingModel {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  HYBRID = 'HYBRID',
}

@Entity('client_agreements')
export class ClientAgreement {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'agreement_name', length: 255 })
  agreementName: string;

  @Column({
    name: 'agreement_type',
    type: 'enum',
    enum: AgreementType,
    default: AgreementType.CONTINGENCY,
    nullable: true,
  })
  agreementType: AgreementType | null;

  @Column({
    name: 'billing_model',
    type: 'enum',
    enum: AgreementBillingModel,
  })
  billingModel: AgreementBillingModel;

  @Column({
    name: 'percentage_fee',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  percentageFee: number | null;

  @Column({
    name: 'fixed_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  fixedFee: number | null;

  @Column({ name: 'replacement_days', type: 'int', nullable: true, default: 90 })
  replacementDays: number | null;

  @Column({ name: 'notice_period_days', type: 'int', nullable: true })
  noticePeriodDays: number | null;

  @Column({
    name: 'revenue_sharing_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  revenueSharingPercentage: number | null;

  @Column({ name: 'credit_period_days', type: 'int', nullable: true, default: 30 })
  creditPeriodDays: number | null;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @Column({ name: 'agreement_url', type: 'text', nullable: true })
  agreementUrl: string | null;


  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
