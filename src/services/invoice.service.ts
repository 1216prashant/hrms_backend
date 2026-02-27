import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from 'src/database/entities/invoice.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';

type InvoiceCreateDto = Partial<Invoice> & {
  requirement_id: number;
  candidate_id: number;
};

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private repo: Repository<Invoice>,
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
  ) {}

  async create(data: InvoiceCreateDto) {
    const { requirement_id, candidate_id, ...rest } = data;

    if (requirement_id == null) {
      throw new BadRequestException('requirement_id is required');
    }
    if (candidate_id == null) {
      throw new BadRequestException('candidate_id is required');
    }

    const [requirement, candidate] = await Promise.all([
      this.requirementRepo.findOne({ where: { id: requirement_id } }),
      this.candidateRepo.findOne({ where: { id: candidate_id } }),
    ]);
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
    }
    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${candidate_id} not found`);
    }

    const invoice = this.repo.create({
      ...rest,
      requirement,
      candidate,
    });
    const saved = await this.repo.save(invoice);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['requirement', 'candidate'],
    });
  }

  async update(data: Partial<InvoiceCreateDto>, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
    if (!existing) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    const { requirement_id, candidate_id, ...rest } = data;

    if (requirement_id != null) {
      const requirement = await this.requirementRepo.findOne({ where: { id: requirement_id } });
      if (!requirement) {
        throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
      }
      existing.requirement = requirement;
    }
    if (candidate_id != null) {
      const candidate = await this.candidateRepo.findOne({ where: { id: candidate_id } });
      if (!candidate) {
        throw new NotFoundException(`Candidate with id ${candidate_id} not found`);
      }
      existing.candidate = candidate;
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  findByRequirementId(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findByCandidateId(candidateId: number) {
    return this.repo.find({
      where: { candidate: { id: candidateId } },
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findByClientId(clientId: string | number) {
    const id = Number(clientId);
    return this.repo.find({
      where: { requirement: { client: { id } } },
      relations: ['requirement', 'candidate', 'requirement.client'],
      order: { id: 'ASC' },
    });
  }
}
