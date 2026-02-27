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

@Entity('client_finance_details')
export class ClientFinanceDetail {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'gst_number', length: 50, nullable: true })
  gstNumber: string | null;

  @Column({ name: 'pan_number', length: 50, nullable: true })
  panNumber: string | null;

  @Column({ name: 'billing_email', length: 255, nullable: true })
  billingEmail: string | null;

  @Column({ name: 'accounts_contact_name', length: 150, nullable: true })
  accountsContactName: string | null;

  @Column({ name: 'accounts_contact_phone', length: 50, nullable: true })
  accountsContactPhone: string | null;

  @Column({ name: 'credit_period_days', type: 'int', nullable: true, default: 30 })
  creditPeriodDays: number | null;

  @Column({ name: 'default_currency', length: 10, nullable: true, default: 'INR' })
  defaultCurrency: string | null;

  @Column({
    name: 'tax_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
  })
  taxPercentage: number | null;

  @Column({ name: 'bank_name', length: 150, nullable: true })
  bankName: string | null;

  @Column({ name: 'bank_account_number', length: 100, nullable: true })
  bankAccountNumber: string | null;

  @Column({ name: 'ifsc_code', length: 50, nullable: true })
  ifscCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
