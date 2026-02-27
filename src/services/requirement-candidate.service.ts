import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';

export type RequirementCandidateCreateDto = Partial<RequirementCandidate> & {
  requirement_id: number;
  candidate_id: number;
  stage_id: number;
};

@Injectable()
export class RequirementCandidateService {
  constructor(
    @InjectRepository(RequirementCandidate)
    private repo: Repository<RequirementCandidate>,
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(CandidateStage)
    private stageRepo: Repository<CandidateStage>,
  ) {}

  private readonly relations = ['requirement', 'candidate', 'stage'] as const;

  async findAll(): Promise<RequirementCandidate[]> {
    return this.repo.find({
      relations: [...this.relations],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<RequirementCandidate> {
    const rc = await this.repo.findOne({
      where: { id },
      relations: [...this.relations],
    });
    if (!rc) {
      throw new NotFoundException(`RequirementCandidate with id ${id} not found`);
    }
    return rc;
  }

  async findByRequirementId(requirementId: number): Promise<RequirementCandidate[]> {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      relations: [...this.relations],
      order: { id: 'ASC' },
    });
  }

  async findByCandidateId(candidateId: number): Promise<RequirementCandidate[]> {
    return this.repo.find({
      where: { candidate: { id: candidateId } },
      relations: [...this.relations],
      order: { id: 'ASC' },
    });
  }

  async create(data: RequirementCandidateCreateDto): Promise<RequirementCandidate> {
    const requirementId = data.requirement_id;
    const { candidate_id, stage_id, requirement_id, ...rest } = data;

    const [requirement, candidate, stage] = await Promise.all([
      this.requirementRepo.findOne({ where: { id: requirementId } }),
      this.candidateRepo.findOne({ where: { id: candidate_id } }),
      this.stageRepo.findOne({ where: { id: stage_id } }),
    ]);
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirementId} not found`);
    }
    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${candidate_id} not found`);
    }
    if (!stage) {
      throw new NotFoundException(`Candidate stage with id ${stage_id} not found`);
    }

    const existing = await this.repo.findOne({
      where: {
        requirement: { id: requirementId },
        candidate: { id: candidate_id },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Candidate ${candidate_id} is already linked to requirement ${requirementId}`,
      );
    }

    const rc = this.repo.create({
      ...rest,
      requirement,
      candidate,
      stage,
    });
    const saved = await this.repo.save(rc);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: [...this.relations],
    }) as Promise<RequirementCandidate>;
  }

  async update(
    id: number,
    data: Partial<RequirementCandidateCreateDto>,
  ): Promise<RequirementCandidate> {
    const existing = await this.findOne(id);
    const { requirement_id, candidate_id, stage_id, ...rest } = data;

    if (requirement_id != null) {
      const rid = Number(requirement_id);
      const requirement = await this.requirementRepo.findOne({ where: { id: rid } });
      if (!requirement) {
        throw new NotFoundException(`Requirement with id ${rid} not found`);
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
    if (stage_id != null) {
      const stage = await this.stageRepo.findOne({ where: { id: stage_id } });
      if (!stage) {
        throw new NotFoundException(`Candidate stage with id ${stage_id} not found`);
      }
      existing.stage = stage;
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }
}
