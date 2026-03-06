import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from 'src/database/entities/candidate.entity';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private repo: Repository<Candidate>,
  ) {}

  async findAll(): Promise<Candidate[]> {
    return this.repo.find({
      where: { isDeleted: false },
      order: { id: 'ASC' },
      relations: ['createdByUser', 'updatedByUser'],
    });
  }

  async findOne(id: number): Promise<Candidate> {
    const candidate = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['createdByUser', 'updatedByUser'],
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${id} not found`);
    }
    return candidate;
  }

  async create(data: Partial<Candidate>, userId?: number): Promise<Candidate> {
    const candidate = this.repo.create({
      ...data,
      ...(userId != null && {
        createdByUser: { id: userId } as User,
        updatedByUser: { id: userId } as User,
      }),
    });
    return this.repo.save(candidate);
  }

  async update(id: number, data: Partial<Candidate>, userId?: number): Promise<Candidate> {
    const existing = await this.findOne(id);
    Object.assign(existing, data);
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    return this.repo.save(existing);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const existing = await this.findOne(id);
    existing.isDeleted = true;
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    await this.repo.save(existing);
  }
}
