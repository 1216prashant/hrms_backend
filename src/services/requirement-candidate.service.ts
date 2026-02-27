import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementCandidate, RequirementCandidateStatus } from 'src/database/entities/requirement-candidate.entity';
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

  private readonly relations = ['requirement', 'candidate', 'stage','requirement.client'] as const;

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
      relations: ['requirement.client'],
      order: { id: 'ASC' },
    });
  }

  async findByCandidateId(candidateId: number): Promise<RequirementCandidate[]> {
    return this.repo.find({
      where: { candidate: { id: candidateId } },
      relations: ['requirement.client'],
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
      relations: ['requirement.client'],
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

  async getRequirementPipeline(requirementId: number) {
    const requirement = await this.requirementRepo.findOne({
      where: { id: requirementId },
      relations: ['client'],
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirementId} not found`);
    }

    const items = await this.findByRequirementId(requirementId);

    const totalCandidates = items.length;
    let active = 0;
    let selected = 0;
    let joined = 0;
    let rejected = 0;

    const stageMap = new Map<
      number,
      {
        stageId: number;
        stageName: string;
        count: number;
      }
    >();

    for (const rc of items) {
      const status = rc.status;
      if (
        status === RequirementCandidateStatus.ACTIVE ||
        status === RequirementCandidateStatus.IN_PROCESS
      ) {
        active += 1;
      } else if (status === RequirementCandidateStatus.SELECTED) {
        selected += 1;
      } else if (status === RequirementCandidateStatus.JOINED) {
        joined += 1;
      } else if (status === RequirementCandidateStatus.REJECTED) {
        rejected += 1;
      }

      if (rc.stage) {
        const id = rc.stage.id;
        const entry = stageMap.get(id) ?? {
          stageId: id,
          stageName: rc.stage.name,
          count: 0,
        };
        entry.count += 1;
        stageMap.set(id, entry);
      }
    }

    const stageSummary = Array.from(stageMap.values()).sort(
      (a, b) => a.stageId - b.stageId,
    );

    const data = items.map((rc) => {
      const c = rc.candidate;
      return {
        applicationId: rc.id,
        candidate: c && {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          experienceYears: c.experienceYears,
          currentCompany: c.currentCompany,
          currentCTC: c.currentCtc,
          expectedCTC: c.expectedCtc,
        },
        stage: rc.stage && {
          id: rc.stage.id,
          name: rc.stage.name,
        },
        status: rc.status,
        offeredCTC: rc.offeredCtc,
        finalCTC: rc.finalCtc,
        joiningDate: rc.joiningDate,
        replacementFlag: Boolean(rc.replacementFlag),
        replacementDueDate: rc.replacementDueDate,
        createdAt: rc.createdAt,
      };
    });

    return {
      success: true,
      requirement: {
        id: requirement.id,
        jobTitle: requirement.jobTitle,
        clientName: requirement.client?.companyName ?? null,
        totalPositions: requirement.totalPositions,
        filledPositions: requirement.closedPositions,
        status: requirement.status,
      },
      summary: {
        totalCandidates,
        active,
        selected,
        joined,
        rejected,
      },
      stageSummary,
      data,
    };
  }
}
