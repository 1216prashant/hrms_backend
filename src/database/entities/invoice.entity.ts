import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';
import { Candidate } from './candidate.entity';
import { BillingModel } from './requirement.entity';
import { User } from './user.entity';

export enum InvoiceStatus {
  RAISED = 'RAISED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED='CANCELLED'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column({ name: 'invoice_number', length: 100, unique: true })
  invoiceNumber: string;

  @Column({ type: 'enum', enum: BillingModel, name: 'billing_model' })
  billingModel: BillingModel;

  @Column({
    name: 'base_ctc',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  baseCtc: number | null;

  @Column({
    name: 'fee_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  feePercentage: number | null;

  @Column({
    name: 'fixed_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  fixedFee: number | null;

  @Column({ name: 'amount_before_tax', type: 'decimal', precision: 12, scale: 2 })
  amountBeforeTax: number;

  @Column({ name: 'gst_amount', type: 'decimal', precision: 12, scale: 2 })
  gstAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2 })
  amountPaid:number

  @Column({ name: 'balance_due', type: 'decimal', precision: 12, scale: 2 })
  balanceDue:number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User | null;
}
