import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany
} from 'typeorm';
import { Requirement } from './requirement.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  FINANCE = 'FINANCE',
}

@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ unique: true, name: 'email' })
  email: string;

  @Column({name: 'password'})
  password: string;

  @Column({ type: 'enum', enum: UserRole, name: 'role' })
  role: UserRole;

  @Column({ default: true, name:'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Requirement, req => req.assignedHr)
  requirements: Requirement[];
}