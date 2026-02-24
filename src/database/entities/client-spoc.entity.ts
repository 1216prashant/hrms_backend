import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "./client.entity";

@Entity('client_spocs')
export class ClientSpoc {

  @PrimaryGeneratedColumn()
  id: string;

  @Column({name: 'name'})
  name: string;

  @Column({ nullable: true, name: 'email' })
  email: string;

  @Column({ nullable: true, name: 'phone' })
  phone: string;

  @Column({ nullable: true, name: 'designation' })
  designation: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Client, client => client.spocs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}