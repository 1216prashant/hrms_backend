import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { Client } from "src/database/entities/client.entity";
import { Requirement, RequirementStatus } from "src/database/entities/requirement.entity";
import { User } from "src/database/entities/user.entity";
import { Repository } from "typeorm";
import { InvoiceService } from "src/services/invoice.service";
import { RequirementStatusLogService } from "src/services/requirement-status-log.service";

type RequirementCreateDto = Partial<Requirement> & {
  client_id?: string | number;
  spoc_id?: string | number;
  assigned_hr_id?: string | number | null;
};

@Injectable()
export class RequirementService {

  constructor(
    @InjectRepository(Requirement)
    private repo: Repository<Requirement>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    @InjectRepository(ClientSpoc)
    private spocRepo: Repository<ClientSpoc>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private invoiceService: InvoiceService,
    private requirementStatusLogService: RequirementStatusLogService,
  ) {}

  async create(data: RequirementCreateDto) {
    const { client_id, spoc_id, assigned_hr_id, ...rest } = data;
    const clientId = client_id != null ? Number(client_id) : undefined;
    const spocId = spoc_id != null ? String(spoc_id) : undefined;

    if (clientId == null || !Number.isInteger(clientId)) {
      throw new BadRequestException('client_id is required and must be a valid number');
    }
    if (!spocId) {
      throw new BadRequestException('spoc_id is required');
    }

    const [clientExists, spocExists] = await Promise.all([
      this.clientRepo.findOne({ where: { id: clientId } }),
      this.spocRepo.findOne({ where: { id: spocId } }),
    ]);
    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }
    if (!spocExists) {
      throw new NotFoundException(`Client SPOC with id ${spocId} not found`);
    }

    let assignedHr: { id: number } | null = null;
    if (assigned_hr_id != null && assigned_hr_id !== '') {
      const hrId = Number(assigned_hr_id);
      if (!Number.isInteger(hrId)) {
        throw new BadRequestException('assigned_hr_id must be a valid user id');
      }
      const hrExists = await this.userRepo.findOne({ where: { id: hrId } });
      if (!hrExists) {
        throw new NotFoundException(`User (assigned HR) with id ${hrId} not found`);
      }
      assignedHr = { id: hrId };
    }

    const requirement = this.repo.create({
      ...rest,
      client: { id: clientId },
      spoc: { id: spocId },
      ...(assignedHr && { assignedHr }),
    });
    const saved = (await this.repo.save(requirement)) as Requirement;
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
  }

  async update(data: RequirementCreateDto, id: number, changedByUserId?: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
    if (!existing) {
      throw new NotFoundException(`Requirement with id ${id} not found`);
    }

    const { client_id, spoc_id, assigned_hr_id, ...rest } = data;

    if (client_id != null) {
      const clientId = Number(client_id);
      if (!Number.isInteger(clientId)) {
        throw new BadRequestException('client_id must be a valid number');
      }
      const clientExists = await this.clientRepo.findOne({ where: { id: clientId } });
      if (!clientExists) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }
      existing.client = { id: clientId } as Client;
    }
    if (spoc_id != null) {
      const spocId = String(spoc_id);
      const spocExists = await this.spocRepo.findOne({ where: { id: spocId } });
      if (!spocExists) {
        throw new NotFoundException(`Client SPOC with id ${spocId} not found`);
      }
      existing.spoc = { id: spocId } as ClientSpoc;
    }
    if (assigned_hr_id !== undefined) {
      if (assigned_hr_id == null || assigned_hr_id === '') {
        existing.assignedHr = null;
      } else {
        const hrId = Number(assigned_hr_id);
        if (!Number.isInteger(hrId)) {
          throw new BadRequestException('assigned_hr_id must be a valid user id');
        }
        const hrExists = await this.userRepo.findOne({ where: { id: hrId } });
        if (!hrExists) {
          throw new NotFoundException(`User (assigned HR) with id ${hrId} not found`);
        }
        existing.assignedHr = { id: hrId } as User;
      }
    }

    const previousStatus = existing.status;
    Object.assign(existing, rest);
    await this.repo.save(existing);
    if (previousStatus !== existing.status) {
      await this.requirementStatusLogService.create({
        requirement_id: id,
        old_status: previousStatus,
        new_status: existing.status,
        changed_by: changedByUserId ?? null,
      });
    }
    if (existing.status === RequirementStatus.CLOSED && previousStatus !== RequirementStatus.CLOSED) {
      await this.invoiceService.createInvoicesForClosedRequirement(id);
    }
    return this.repo.findOne({
      where: { id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
  }

  /**
   * Returns requirement_id -> total_active_days (sum of days in OPEN/REOPENED) for each id.
   * Requirements with no OPEN/REOPENED periods are omitted (caller can treat as null).
   */
  private async getTotalActiveDaysMap(requirementIds: number[]): Promise<Map<number, number>> {
    if (requirementIds.length === 0) return new Map();
    const placeholders = requirementIds.map(() => '?').join(',');
    const sql = `
      WITH status_flow AS (
        SELECT
          requirement_id,
          new_status,
          changed_at,
          LEAD(new_status) OVER (
            PARTITION BY requirement_id
            ORDER BY changed_at
          ) AS next_status,
          LEAD(changed_at) OVER (
            PARTITION BY requirement_id
            ORDER BY changed_at
          ) AS next_changed_at
        FROM requirement_status_logs
        WHERE requirement_id IN (${placeholders})
      )
      SELECT
        requirement_id,
        SUM(
          CASE
            WHEN new_status IN ('OPEN', 'REOPENED')
            THEN DATEDIFF(
              CASE
                WHEN next_status = 'CLOSED'
                THEN next_changed_at
                ELSE CURRENT_DATE
              END,
              changed_at
            )
            ELSE 0
          END
        ) AS total_tat_days
      FROM status_flow
      GROUP BY requirement_id
    `;
    const rows = await this.repo.manager.query(sql, requirementIds) as { requirement_id: number; total_tat_days: number }[];
    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(row.requirement_id, row.total_tat_days);
    }
    return map;
  }

  async findAll() {
    const list = await this.repo.find({ relations: ['client', 'spoc', 'assignedHr'] });
    const ids = list.map((r) => r.id);
    const totalActiveDaysMap = await this.getTotalActiveDaysMap(ids);
    return list.map((r) => ({
      ...r,
      totalActiveDays: totalActiveDaysMap.get(r.id) ?? null,
    }));
  }

  async findOne(id: number) {
    const requirement = await this.repo.findOne({
      where: { id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
    if (!requirement) return null;
    const totalActiveDaysMap = await this.getTotalActiveDaysMap([id]);
    return {
      ...requirement,
      totalActiveDays: totalActiveDaysMap.get(id) ?? null,
    };
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  /**
   * Reopens a closed requirement when a joined candidate exits (resigned/terminated/absconded/client rejected).
   * Updates: status = REOPENED, closedPositions -= 1, openPositions += 1. totalPositions unchanged.
   */
  async reopenDueToReplacement(requirementId: number, changedByUserId?: number) {
    const requirement = await this.repo.findOne({
      where: { id: requirementId },
      relations: ['client', 'spoc', 'assignedHr'],
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirementId} not found`);
    }
    if (requirement.status !== RequirementStatus.CLOSED) {
      throw new BadRequestException(
        'Requirement can only be reopened when it is closed (e.g. after a joined candidate exits).',
      );
    }
    requirement.closedPositions = Math.max(0, requirement.closedPositions - 1);
    requirement.openPositions = requirement.openPositions + 1;
    const previousStatus = requirement.status;
    requirement.status = RequirementStatus.REOPENED;
    await this.repo.save(requirement);
    await this.requirementStatusLogService.create({
      requirement_id: requirementId,
      old_status: previousStatus,
      new_status: RequirementStatus.REOPENED,
      changed_by: changedByUserId ?? null,
    });
    return this.repo.findOne({
      where: { id: requirementId },
      relations: ['client', 'spoc', 'assignedHr'],
    });
  }

  async findByClientId(id: string | number) {
    const clientId = Number(id);
    const list = await this.repo.find({
      where: { client: { id: clientId } },
      relations: ['client', 'spoc', 'assignedHr'],
    });
    const ids = list.map((r) => r.id);
    const totalActiveDaysMap = await this.getTotalActiveDaysMap(ids);
    return list.map((r) => ({
      ...r,
      totalActiveDays: totalActiveDaysMap.get(r.id) ?? null,
    }));
  }
}