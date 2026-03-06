import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientSpoc } from './client-spoc.entity';
import { Requirement } from './requirement.entity';
import { User } from './user.entity';

export enum ClientType {
  STARTUP = 'STARTUP',
  SME = 'SME',
  ENTERPRISE = 'ENTERPRISE',
  MNC = 'MNC',
}


export enum Sources {
  REFERRAL = 'REFERRAL',
  COLD_CALL = 'COLD_CALL',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ name: 'legal_name', length: 255, nullable: true })
  legalName: string | null;

  @Column({ name: 'industry', length: 150, nullable: true })
  industry: string | null;

  @Column({ name: 'website', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'linkedin_url', length: 255, nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'primary_phone', length: 50, nullable: true })
  primaryPhone: string | null;

  @Column({ name: 'primary_email', length: 255, nullable: true })
  primaryEmail: string | null;

  @Column({ name: 'billing_address', type: 'text', nullable: true })
  billingAddress: string | null;

  @Column({ name: 'city', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'state', length: 100, nullable: true })
  state: string | null;

  @Column({ name: 'country', length: 100, nullable: true })
  country: string | null;

  @Column({ name: 'pincode', length: 20, nullable: true })
  pincode: string | null;

  @Column({ name: 'account_manager_id', type: 'int', unsigned: true, nullable: true })
  accountManagerId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'account_manager_id' })
  accountManager: User | null;

  @Column({
    name: 'client_type',
    type: 'enum',
    enum: ClientType,
    nullable: true,
  })
  clientType: ClientType | null;

  @Column({ name: 'source', length: 100, nullable: true })
  source: Sources | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_blacklisted', type: 'boolean', default: false })
  isBlacklisted: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany(() => ClientSpoc, (spoc) => spoc.client)
  spocs: ClientSpoc[];

  @OneToMany(() => Requirement, (req) => req.client)
  requirements: Requirement[];
}