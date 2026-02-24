import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from 'src/database/entities/candidate.entity';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private repo: Repository<Candidate>,
  ) {}

  async findAll(): Promise<Candidate[]> {
    return this.repo.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Candidate> {
    const candidate = await this.repo.findOne({ where: { id } });
    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${id} not found`);
    }
    return candidate;
  }

  async create(data: Partial<Candidate>): Promise<Candidate> {
    const candidate = this.repo.create(data);
    return this.repo.save(candidate);
  }

  async update(id: number, data: Partial<Candidate>): Promise<Candidate> {
    const existing = await this.findOne(id);
    Object.assign(existing, data);
    return this.repo.save(existing);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }
}
