import {
    Entity, PrimaryGeneratedColumn, Column,
    OneToMany, CreateDateColumn
  } from 'typeorm';
  import { ClientSpoc } from './client-spoc.entity';
  import { Requirement } from './requirement.entity';
  
  @Entity('clients')
  export class Client {
  
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'company_name' })
    companyName: string;
  
    @Column({ nullable: true })
    industry: string;
  
    @Column({ nullable: true, type: 'text' })
    address: string;
  
    @Column({ default: true, name: 'is_active' })
    isActive: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @OneToMany(() => ClientSpoc, spoc => spoc.client)
    spocs: ClientSpoc[];
  
    @OneToMany(() => Requirement, req => req.client)
    requirements: Requirement[];
  }