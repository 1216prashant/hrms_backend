import {
    Entity, PrimaryGeneratedColumn, Column,
    OneToMany, CreateDateColumn
  } from 'typeorm';
  import { ClientSpoc } from './client-spoc.entity';
  import { Requirement } from './requirement.entity';
  
  @Entity('clients')
  export class Client {
  
    @PrimaryGeneratedColumn()
    id: string;
  
    @Column({ name: 'company_name' })
    companyName: string;
  
    @Column({ nullable: true, name: 'industry' })
    industry: string;
  
    @Column({ nullable: true, type: 'text', name: 'address' })
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