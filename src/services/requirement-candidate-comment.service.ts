import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RequirementCandidateComment,
  CommentType,
  EventReason,
} from 'src/database/entities/requirement-candidate-comment.entity';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { User } from 'src/database/entities/user.entity';

/** Default user id for system-generated comments (e.g. stage/status change). Ensure this user exists. */
const DEFAULT_SYSTEM_USER_ID = 1;

export type ApplicationEventCommentPayload = {
  comment: string;
  commentType: CommentType;
  eventReason?: EventReason | null;
  isInternal?: number | null;
};

export type RequirementCandidateCommentCreateDto = Partial<RequirementCandidateComment> & {
  requirement_candidate_id: number;
  user_id: number;
};

@Injectable()
export class RequirementCandidateCommentService {
  constructor(
    @InjectRepository(RequirementCandidateComment)
    private repo: Repository<RequirementCandidateComment>,
    @InjectRepository(RequirementCandidate)
    private requirementCandidateRepo: Repository<RequirementCandidate>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(data: RequirementCandidateCommentCreateDto) {
    const { requirement_candidate_id, user_id, ...rest } = data;

    if (requirement_candidate_id == null) {
      throw new BadRequestException('requirement_candidate_id is required');
    }
    if (user_id == null) {
      throw new BadRequestException('user_id is required');
    }

    const [requirementCandidate, user] = await Promise.all([
      this.requirementCandidateRepo.findOne({
        where: { id: requirement_candidate_id },
      }),
      this.userRepo.findOne({ where: { id: user_id } }),
    ]);
    if (!requirementCandidate) {
      throw new NotFoundException(
        `Requirement candidate with id ${requirement_candidate_id} not found`,
      );
    }
    if (!user) {
      throw new NotFoundException(`User with id ${user_id} not found`);
    }

    const comment = this.repo.create({
      ...rest,
      requirementCandidate,
      user,
    });
    const saved = await this.repo.save(comment);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['requirementCandidate', 'user'],
    });
  }

  async update(
    data: Partial<RequirementCandidateCommentCreateDto>,
    id: number,
  ) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['requirementCandidate', 'user'],
    });
    if (!existing) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    const { requirement_candidate_id, user_id, ...rest } = data;

    if (requirement_candidate_id != null) {
      const rc = await this.requirementCandidateRepo.findOne({
        where: { id: requirement_candidate_id },
      });
      if (!rc) {
        throw new NotFoundException(
          `Requirement candidate with id ${requirement_candidate_id} not found`,
        );
      }
      existing.requirementCandidate = rc;
    }
    if (user_id != null) {
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException(`User with id ${user_id} not found`);
      }
      existing.user = user;
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['requirementCandidate', 'user'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['requirementCandidate', 'user'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const comment = await this.repo.findOne({
      where: { id },
      relations: ['requirementCandidate', 'user'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  findByApplicationId(applicationId: number) {
    return this.repo.find({
      where: { requirementCandidate: { id: applicationId } },
      relations: ['requirementCandidate', 'user'],
      order: { id: 'ASC' },
    });
  }

  /**
   * Adds an application event comment (e.g. stage change, dropped) without requiring user_id from API.
   * Uses systemUserId (default 1) as the comment author. Use for auto-generated comments.
   */
  async addApplicationEventComment(
    requirementCandidateId: number,
    payload: ApplicationEventCommentPayload,
    systemUserId: number = DEFAULT_SYSTEM_USER_ID,
  ): Promise<RequirementCandidateComment | null> {
    const rc = await this.requirementCandidateRepo.findOne({
      where: { id: requirementCandidateId },
    });
    if (!rc) return null;
    const user = await this.userRepo.findOne({ where: { id: systemUserId } });
    if (!user) return null;
    const comment = this.repo.create({
      requirementCandidate: rc,
      user,
      comment: payload.comment,
      commentType: payload.commentType,
      eventReason: payload.eventReason ?? null,
      isInternal: payload.isInternal ?? 1,
    });
    const saved = await this.repo.save(comment);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['requirementCandidate', 'user'],
    });
  }
}
