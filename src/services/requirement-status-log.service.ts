import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementStatusLog } from 'src/database/entities/requirement-status-log.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { User } from 'src/database/entities/user.entity';
import { RequirementStatus } from 'src/database/entities/requirement.entity';

export type RequirementStatusLogCreateDto = {
  requirement_id: number;
  old_status?: RequirementStatus | null;
  new_status: RequirementStatus;
  changed_by?: number | null;
};

@Injectable()
export class RequirementStatusLogService {
  constructor(
    @InjectRepository(RequirementStatusLog)
    private repo: Repository<RequirementStatusLog>,
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private readonly relations = ['requirement', 'changedBy'] as const;

  async findAll(): Promise<RequirementStatusLog[]> {
    return this.repo.find({
      relations: [...this.relations],
      order: { changedAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<RequirementStatusLog> {
    const log = await this.repo.findOne({
      where: { id },
      relations: [...this.relations],
    });
    if (!log) {
      throw new NotFoundException(`RequirementStatusLog with id ${id} not found`);
    }
    return log;
  }

  async findByRequirementId(requirementId: number): Promise<RequirementStatusLog[]> {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      relations: [...this.relations],
      order: { changedAt: 'DESC', id: 'DESC' },
    });
  }

  async create(data: RequirementStatusLogCreateDto): Promise<RequirementStatusLog> {
    const { requirement_id, old_status, new_status, changed_by } = data;

    const requirement = await this.requirementRepo.findOne({
      where: { id: requirement_id },
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
    }

    let changedByUser: User | null = null;
    if (changed_by != null) {
      changedByUser = await this.userRepo.findOne({ where: { id: changed_by } });
      if (!changedByUser) {
        throw new NotFoundException(`User with id ${changed_by} not found`);
      }
    }

    const log = this.repo.create({
      oldStatus: old_status ?? null,
      newStatus: new_status,
      requirement,
      changedBy: changedByUser,
    });
    const saved = await this.repo.save(log);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: [...this.relations],
    }) as Promise<RequirementStatusLog>;
  }

  async update(
    id: number,
    data: Partial<RequirementStatusLogCreateDto>,
  ): Promise<RequirementStatusLog> {
    const existing = await this.findOne(id);
    const { requirement_id, old_status, new_status, changed_by } = data;

    if (requirement_id != null) {
      const requirement = await this.requirementRepo.findOne({
        where: { id: requirement_id },
      });
      if (!requirement) {
        throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
      }
      existing.requirement = requirement;
    }

    if (old_status !== undefined) {
      existing.oldStatus = old_status ?? null;
    }
    if (new_status !== undefined) {
      existing.newStatus = new_status;
    }

    if (changed_by !== undefined) {
      if (changed_by == null) {
        existing.changedBy = null;
      } else {
        const user = await this.userRepo.findOne({ where: { id: changed_by } });
        if (!user) {
          throw new NotFoundException(`User with id ${changed_by} not found`);
        }
        existing.changedBy = user;
      }
    }

    await this.repo.save(existing);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }
}
