import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: Date;

  @Column({ name: 'payment_mode', length: 50, nullable: true })
  paymentMode: string | null;

  @Column({ name: 'transaction_reference', length: 150, nullable: true })
  transactionReference: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
