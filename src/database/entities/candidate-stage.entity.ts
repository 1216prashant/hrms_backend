import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('candidate_stages')
export class CandidateStage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column()
  sequence: number;
}
