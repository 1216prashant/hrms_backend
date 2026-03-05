import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(CandidateStage)
    private repo: Repository<CandidateStage>,
  ) {}

  async create(data: Partial<CandidateStage>) {
    const stage = this.repo.create(data);
    return this.repo.save(stage);
  }

  async update(id: number, data: Partial<CandidateStage>) {
    const stage = await this.repo.findOne({ where: { id } });
    Object.assign(stage, data);
    return this.repo.save(stage);
  }
  async findAll() {
    return this.repo.find();
  }
  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }
  async remove(id: number) {
    return this.repo.delete(id);
  }
}
