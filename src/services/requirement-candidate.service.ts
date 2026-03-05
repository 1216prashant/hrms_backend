import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementCandidate, RequirementCandidateStatus } from 'src/database/entities/requirement-candidate.entity';
import { Requirement, RequirementStatus } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';
import { InvoiceService } from 'src/services/invoice.service';
import { RequirementCandidateCommentService } from 'src/services/requirement-candidate-comment.service';
import { CommentType, EventReason } from 'src/database/entities/requirement-candidate-comment.entity';
import { RequirementService } from 'src/services/requirement.service';
import { RequirementStatusLogService } from 'src/services/requirement-status-log.service';

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
    private applicationRepo: Repository<Requirement>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(CandidateStage)
    private stageRepo: Repository<CandidateStage>,
    private invoiceService: InvoiceService,
    private commentService: RequirementCandidateCommentService,
    private requirementService: RequirementService,
    private requirementStatusLogService: RequirementStatusLogService,
  ) {}

  private readonly relations = ['requirement', 'candidate', 'stage','requirement.client'] as const;

  private static isJoinedStage(stage: CandidateStage | null): boolean {
    return stage != null && stage.name.toUpperCase() === 'JOINED';
  }

  /** Finds a stage suitable for replacement/exited. Tries exact name match first, then contains. */
  private async findReplacementStage(): Promise<CandidateStage | null> {
    const stages = await this.stageRepo.find({ order: { sequence: 'ASC' } });
    const exactNames = ['REPLACEMENT', 'DROPPED', 'EXITED', 'REPLACEMENT TRIGGERED'];
    for (const name of exactNames) {
      const stage = stages.find((s) => s.name.toUpperCase() === name);
      if (stage) return stage;
    }
    const containsTerms = ['REPLACEMENT', 'DROPPED', 'EXITED'];
    for (const term of containsTerms) {
      const stage = stages.find((s) => s.name.toUpperCase().includes(term));
      if (stage) return stage;
    }
    return null;
  }

  private async updateRequirementOnCandidateJoined(
    requirement: Requirement,
    changedByUserId?: number,
  ): Promise<void> {
    const open = Math.max(0, requirement.openPositions - 1);
    const closed = Math.min(
      requirement.totalPositions,
      requirement.closedPositions + 1,
    );
    const previousStatus = requirement.status;
    requirement.openPositions = open;
    requirement.closedPositions = closed;
    requirement.status =
      closed >= requirement.totalPositions
        ? RequirementStatus.CLOSED
        : RequirementStatus.PARTIALLY_CLOSED;
    await this.applicationRepo.save(requirement);
    if (previousStatus !== requirement.status) {
      await this.requirementStatusLogService.create({
        requirement_id: requirement.id,
        old_status: previousStatus,
        new_status: requirement.status,
        changed_by: changedByUserId ?? null,
      });
    }
    if (requirement.status === RequirementStatus.CLOSED && previousStatus !== RequirementStatus.CLOSED) {
      await this.invoiceService.createInvoicesForClosedRequirement(requirement.id);
    }
  }

  async findAll(): Promise<RequirementCandidate[]> {
    const list = await this.repo.find({
      relations: [...this.relations, 'comments', 'comments.user'],
      order: { id: 'ASC' },
    });
    list.forEach((rc) => {
      if (rc.comments?.length) {
        rc.comments.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    });
    return list;
  }

  async findOne(id: number): Promise<RequirementCandidate> {
    const rc = await this.repo.findOne({
      where: { id },
      relations: [...this.relations, 'comments', 'comments.user'],
    });
    if (!rc) {
      throw new NotFoundException(`RequirementCandidate with id ${id} not found`);
    }
    if (rc.comments?.length) {
      rc.comments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return rc;
  }

  async findByApplicationId(requirementId: number): Promise<RequirementCandidate[]> {
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

  async create(data: RequirementCandidateCreateDto, changedByUserId?: number): Promise<RequirementCandidate> {
    const requirementId = data.requirement_id;
    const { candidate_id, stage_id, requirement_id, ...rest } = data;

    const [requirement, candidate, stage] = await Promise.all([
      this.applicationRepo.findOne({ where: { id: requirementId } }),
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
    if (RequirementCandidateService.isJoinedStage(stage)) {
      rc.status = RequirementCandidateStatus.JOINED;
      await this.updateRequirementOnCandidateJoined(requirement, changedByUserId);
    }
    const saved = await this.repo.save(rc);
    await this.commentService.addApplicationEventComment(saved.id, {
      comment: `Application created. Stage: ${stage.name}.`,
      commentType: CommentType.STATUS_CHANGE,
    });
    return this.repo.findOne({
      where: { id: saved.id },
      relations: [...this.relations],
    }) as Promise<RequirementCandidate>;
  }

  async update(
    id: number,
    data: Partial<RequirementCandidateCreateDto>,
    changedByUserId?: number,
  ): Promise<RequirementCandidate> {
    const existing = await this.findOne(id);
    const previousStage = existing.stage;
    const previousStatus = existing.status;
    const { requirement_id, candidate_id, stage_id, ...rest } = data;

    if (requirement_id != null) {
      const rid = Number(requirement_id);
      const requirement = await this.applicationRepo.findOne({ where: { id: rid } });
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
    let newStage: CandidateStage | null = null;
    if (stage_id != null) {
      const stage = await this.stageRepo.findOne({ where: { id: stage_id } });
      if (!stage) {
        throw new NotFoundException(`Candidate stage with id ${stage_id} not found`);
      }
      existing.stage = stage;
      newStage = stage;
    }

    const newlyJoined =
      newStage != null &&
      RequirementCandidateService.isJoinedStage(newStage) &&
      !RequirementCandidateService.isJoinedStage(previousStage);
    if (newlyJoined) {
      existing.status = RequirementCandidateStatus.JOINED;
      const requirement = existing.requirement;
      await this.updateRequirementOnCandidateJoined(requirement, changedByUserId);
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);

    await this.addApplicationChangeComments(id, {
      previousStage,
      newStage,
      previousStatus,
      newStatus: existing.status,
    });

    return this.findOne(id);
  }

  private async addApplicationChangeComments(
    requirementCandidateId: number,
    ctx: {
      previousStage: CandidateStage | null;
      newStage: CandidateStage | null;
      previousStatus: RequirementCandidateStatus | null;
      newStatus: RequirementCandidateStatus | null;
    },
  ): Promise<void> {
    const { previousStage, newStage, previousStatus, newStatus } = ctx;

    if (newStage != null && previousStage?.id !== newStage.id) {
      const stageName = newStage.name.toUpperCase();
      const comment =
        stageName === 'INTERVIEW_SCHEDULED'
          ? 'Interview scheduled.'
          : `Stage changed from ${previousStage?.name ?? '—'} to ${newStage.name}.`;
      await this.commentService.addApplicationEventComment(requirementCandidateId, {
        comment,
        commentType:
          stageName === 'INTERVIEW_SCHEDULED'
            ? CommentType.INTERVIEW_FEEDBACK
            : CommentType.STATUS_CHANGE,
      });
    }

    if (newStatus !== previousStatus) {
      if (newStatus === RequirementCandidateStatus.DROPPED) {
        await this.commentService.addApplicationEventComment(requirementCandidateId, {
          comment: 'Candidate dropped.',
          commentType: CommentType.STATUS_CHANGE,
        });
      } else if (newStatus === RequirementCandidateStatus.REJECTED) {
        await this.commentService.addApplicationEventComment(requirementCandidateId, {
          comment: 'Candidate rejected.',
          commentType: CommentType.STATUS_CHANGE,
        });
      }
    }
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }

  /**
   * Finds the application (requirement_candidate) by requirement id and candidate id,
   * then records replacement. Use this when you have requirement_id and candidate_id.
   */
  async recordReplacementByRequirementAndCandidate(
    requirementId: number,
    candidateId: number,
    eventReason: EventReason,
    changedByUserId?: number,
  ): Promise<RequirementCandidate> {
    const rc = await this.repo.findOne({
      where: {
        requirement: { id: requirementId },
        candidate: { id: candidateId },
      },
      relations: [...this.relations],
    });
    if (!rc) {
      throw new NotFoundException(
        `No application found for requirement_id ${requirementId} and candidate_id ${candidateId}.`,
      );
    }
    return this.recordReplacement(rc.id, eventReason, candidateId, changedByUserId);
  }

  /**
   * Records that a joined candidate has exited (resigned/terminated/absconded/client rejected).
   * id = requirement_candidate.id (the application row id). If candidate_id is provided, validates it matches.
   * Updates application status to DROPPED, reopens the requirement (REOPENED, closedPositions--,
   * openPositions++), and adds an application comment with REPLACEMENT_TRIGGER and event reason.
   */
  async recordReplacement(
    id: number,
    eventReason: EventReason,
    candidateId?: number,
    changedByUserId?: number,
  ): Promise<RequirementCandidate> {
    const rc = await this.repo.findOne({
      where: { id },
      relations: [...this.relations],
    });
    if (!rc) {
      throw new NotFoundException(`Requirement candidate with id ${id} not found`);
    }
    if (rc.status !== RequirementCandidateStatus.JOINED) {
      throw new BadRequestException(
        'Replacement can only be recorded for a candidate who had joined.',
      );
    }
    if (candidateId != null && Number(rc.candidate?.id) !== Number(candidateId)) {
      throw new BadRequestException(
        `Application (id ${id}) does not belong to candidate_id ${candidateId}.`,
      );
    }
    const requirement = rc.requirement;
    if (!requirement) {
      throw new BadRequestException('Application has no requirement.');
    }
    if (requirement.status !== RequirementStatus.CLOSED) {
      throw new BadRequestException(
        'Requirement must be closed to record a replacement (reopen).',
      );
    }

    await this.requirementService.reopenDueToReplacement(requirement.id, changedByUserId);

    const replacementStage = await this.findReplacementStage();
    rc.replacementFlag = 1;
    rc.status = RequirementCandidateStatus.DROPPED;
    if (replacementStage) {
      rc.stage = replacementStage;
    }
    await this.repo.save(rc);

    const commentByReason: Record<EventReason, string> = {
      [EventReason.RESIGNED]: 'Requirement reopened. Candidate resigned.',
      [EventReason.TERMINATED]: 'Requirement reopened. Candidate terminated.',
      [EventReason.ABSCONDED]: 'Requirement reopened. Candidate absconded.',
      [EventReason.CLIENT_REJECTED_AFTER_JOIN]:
        'Requirement reopened. Client rejected candidate after joining.',
    };
    await this.commentService.addApplicationEventComment(rc.id, {
      comment: commentByReason[eventReason],
      commentType: CommentType.REPLACEMENT_TRIGGER,
      eventReason,
    });

    return this.findOne(id);
  }

  async getApplicationPipeline(applicationId: number) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['client'],
    });
    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }

    const items = await this.findByApplicationId(applicationId);

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
      application: {
        id: application.id,
        jobTitle: application.jobTitle,
        clientName: application.client?.companyName ?? null,
        totalPositions: application.totalPositions,
        filledPositions: application.closedPositions,
        status: application.status,
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
