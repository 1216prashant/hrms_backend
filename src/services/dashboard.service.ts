import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, RequirementStatus } from 'src/database/entities/requirement.entity';
import { RequirementCandidate, RequirementCandidateStatus } from 'src/database/entities/requirement-candidate.entity';
import { Invoice, InvoiceStatus } from 'src/database/entities/invoice.entity';
import { Payment } from 'src/database/entities/payment.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';
import { User } from 'src/database/entities/user.entity';
import { Client } from 'src/database/entities/client.entity';
import {
  DashboardResponse,
  DashboardFilters,
  DashboardKpis,
  DashboardRevenue,
  DashboardPipeline,
  DashboardFinance,
  HrPerformanceItem,
  ReplacementRiskItem,
  HrDashboardData,
  HrDashboardFilters,
  HrMyPerformance,
  HrPipeline,
  HrRequirements,
  HrActivitySummary,
  HrAlerts,
} from 'src/modules/dashboard/interfaces/dashboard-response.interface';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(RequirementCandidate)
    private rcRepo: Repository<RequirementCandidate>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(CandidateStage)
    private stageRepo: Repository<CandidateStage>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async getDashboard(from?: string, to?: string, assignedHrId?: number): Promise<DashboardResponse> {
    const filterFrom = from ? new Date(from) : this.startOfMonth(new Date());
    const filterTo = to ? new Date(to) : new Date();
    const filters: DashboardFilters = {
      from: filterFrom.toISOString().slice(0, 10),
      to: filterTo.toISOString().slice(0, 10),
    };

    const [
      kpis,
      revenue,
      pipeline,
      hrPerformance,
      finance,
      replacementRisk,
    ] = await Promise.all([
      this.getKpis(filterFrom, filterTo, assignedHrId),
      this.getRevenue(filterFrom, filterTo, assignedHrId),
      this.getPipeline(filterFrom, filterTo, assignedHrId),
      this.getHrPerformance(filterFrom, filterTo, assignedHrId),
      this.getFinance(filterFrom, filterTo, assignedHrId),
      this.getReplacementRisk(assignedHrId),
    ]);

    return {
      success: true,
      filters,
      kpis,
      revenue,
      pipeline,
      hrPerformance,
      finance,
      replacementRisk,
    };
  }

  async getDashboardForHr(from?: string, to?: string, hrId: number = 0): Promise<HrDashboardData> {
    const filterFrom = from ? new Date(from) : this.startOfMonth(new Date());
    const filterTo = to ? new Date(to) : new Date();
    const fromStr = filterFrom.toISOString().slice(0, 10);
    const toStr = filterTo.toISOString().slice(0, 10);
    const filters: HrDashboardFilters = { from: fromStr, to: toStr };

    const user = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect('u.name', 'name')
      .where('u.id = :hrId', { hrId })
      .getRawOne<{ id: number; name: string }>();

    const [
      activeRequirements,
      requirementsHandled,
      candidatesInPipeline,
      joinedThisMonth,
      offersReleased,
      avgClosureDays,
      stageRows,
      candidateStatusRows,
      reqStatusRows,
      myOpenReqs,
      candidatesAdded,
      candidatesJoined,
      replacementRisk,
      staleReqs,
      stuckCandidates,
    ] = await Promise.all([
      this.getHrActiveRequirementsCount(hrId),
      this.getHrRequirementsHandledCount(hrId),
      this.getHrCandidatesInPipelineCount(hrId),
      this.getHrJoinedThisMonth(fromStr, toStr, hrId),
      this.getHrOffersReleased(fromStr, toStr, hrId),
      this.getHrAvgClosureDays(hrId),
      this.getHrStageDistribution(hrId),
      this.getHrCandidateStatusDistribution(hrId),
      this.getHrRequirementStatusDistribution(hrId),
      this.getHrMyOpenRequirements(hrId),
      this.getHrCandidatesAdded(fromStr, toStr, hrId),
      this.getHrCandidatesJoined(fromStr, toStr, hrId),
      this.getReplacementRisk(hrId),
      this.getHrStaleRequirements(hrId),
      this.getHrStuckCandidates(hrId),
    ]);

    const conversionRate =
      requirementsHandled > 0 ? Math.round((joinedThisMonth / requirementsHandled) * 100) : 0;

    const myPerformance: HrMyPerformance = {
      hrId,
      hrName: user?.name ?? '',
      activeRequirements,
      requirementsHandled,
      candidatesInPipeline,
      joinedThisMonth,
      offersReleased,
      avgClosureDays,
      conversionRate,
    };

    const pipeline: HrPipeline = {
      stageDistribution: stageRows.map((r) => ({ stage: r.stage, count: Number(r.count) })),
      candidateStatus: candidateStatusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
    };

    const requirements: HrRequirements = {
      statusDistribution: reqStatusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
      myOpenRequirements: myOpenReqs,
    };

    const activitySummary: HrActivitySummary = {
      candidatesAdded,
      interviewsScheduled: 0,
      offersReleased,
      candidatesJoined,
    };

    const alerts: HrAlerts = {
      replacementRisk,
      staleRequirements: staleReqs,
      stuckCandidates,
    };

    return {
      filters,
      myPerformance,
      pipeline,
      requirements,
      activitySummary,
      alerts,
    };
  }

  private async getHrActiveRequirementsCount(hrId: number): Promise<number> {
    return this.requirementRepo
      .createQueryBuilder('r')
      .where('r.status IN (:...statuses)', {
        statuses: [RequirementStatus.OPEN, RequirementStatus.PARTIALLY_CLOSED, RequirementStatus.REOPENED],
      })
      .andWhere('r.assigned_hr_id = :hrId', { hrId })
      .getCount();
  }

  private async getHrRequirementsHandledCount(hrId: number): Promise<number> {
    return this.requirementRepo
      .createQueryBuilder('r')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .getCount();
  }

  private async getHrCandidatesInPipelineCount(hrId: number): Promise<number> {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .where('rc.status IN (:...statuses)', {
        statuses: [
          RequirementCandidateStatus.ACTIVE,
          RequirementCandidateStatus.IN_PROCESS,
          RequirementCandidateStatus.SELECTED,
        ],
      })
      .andWhere('r.assigned_hr_id = :hrId', { hrId })
      .getCount();
  }

  private async getHrJoinedThisMonth(fromStr: string, toStr: string, hrId: number): Promise<number> {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('r.assigned_hr_id = :hrId', { hrId })
      .getCount();
  }

  private async getHrOffersReleased(fromStr: string, toStr: string, hrId: number): Promise<number> {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .innerJoin('candidate_stages', 's', 's.id = rc.stage_id')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .andWhere('UPPER(s.name) LIKE :offer', { offer: '%OFFER%' })
      .andWhere('DATE(rc.updated_at) BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .getCount();
  }

  private async getHrAvgClosureDays(hrId: number): Promise<number> {
    const row = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .select('AVG(GREATEST(0, DATEDIFF(rc.joining_date, rc.created_at)))', 'avgDays')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date IS NOT NULL')
      .andWhere('r.assigned_hr_id = :hrId', { hrId })
      .getRawOne<{ avgDays: string | null }>();
    return Math.round(Number(row?.avgDays ?? 0));
  }

  private async getHrStageDistribution(hrId: number) {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .innerJoin('candidate_stages', 's', 's.id = rc.stage_id')
      .select('s.name', 'stage')
      .addSelect('COUNT(rc.id)', 'count')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .groupBy('s.id')
      .addGroupBy('s.name')
      .getRawMany<{ stage: string; count: string }>();
  }

  private async getHrCandidateStatusDistribution(hrId: number) {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .select('rc.status', 'status')
      .addSelect('COUNT(rc.id)', 'count')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .groupBy('rc.status')
      .getRawMany<{ status: string; count: string }>();
  }

  private async getHrRequirementStatusDistribution(hrId: number) {
    return this.requirementRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .groupBy('r.status')
      .getRawMany<{ status: string; count: string }>();
  }

  private async getHrMyOpenRequirements(hrId: number) {
    const rows = await this.requirementRepo
      .createQueryBuilder('r')
      .innerJoin('clients', 'c', 'c.id = r.client_id')
      .select('r.id', 'requirementId')
      .addSelect('c.company_name', 'clientName')
      .addSelect('r.job_title', 'jobTitle')
      .addSelect('r.open_positions', 'openPositions')
      .addSelect('DATEDIFF(CURDATE(), r.created_at)', 'daysOpen')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [RequirementStatus.OPEN, RequirementStatus.PARTIALLY_CLOSED, RequirementStatus.REOPENED],
      })
      .andWhere('r.open_positions > 0')
      .orderBy('r.created_at', 'ASC')
      .getRawMany<{ requirementId: number; clientName: string; jobTitle: string; openPositions: string; daysOpen: string }>();
    return rows.map((row) => ({
      requirementId: row.requirementId,
      clientName: row.clientName ?? '',
      jobTitle: row.jobTitle ?? '',
      openPositions: Number(row.openPositions),
      daysOpen: Number(row.daysOpen),
    }));
  }

  private async getHrCandidatesAdded(fromStr: string, toStr: string, hrId: number): Promise<number> {
    return this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .andWhere('DATE(rc.created_at) BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .getCount();
  }

  private async getHrCandidatesJoined(fromStr: string, toStr: string, hrId: number): Promise<number> {
    return this.getHrJoinedThisMonth(fromStr, toStr, hrId);
  }

  /** Requirements still OPEN/PARTIALLY_CLOSED/REOPENED that were created more than daysThreshold ago. */
  private async getHrStaleRequirements(hrId: number, daysThreshold = 14) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const rows = await this.requirementRepo
      .createQueryBuilder('r')
      .innerJoin('clients', 'c', 'c.id = r.client_id')
      .select('r.id', 'requirementId')
      .addSelect('c.company_name', 'clientName')
      .addSelect('r.job_title', 'jobTitle')
      .addSelect('DATEDIFF(CURDATE(), r.created_at)', 'daysOpen')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [RequirementStatus.OPEN, RequirementStatus.PARTIALLY_CLOSED, RequirementStatus.REOPENED],
      })
      .andWhere('r.created_at < :cutoff', { cutoff: cutoffStr })
      .getRawMany<{ requirementId: number; clientName: string; jobTitle: string; daysOpen: string }>();
    return rows.map((row) => ({
      requirementId: row.requirementId,
      clientName: row.clientName ?? '',
      jobTitle: row.jobTitle ?? '',
      daysOpen: Number(row.daysOpen),
    }));
  }

  /** Pipeline candidates (ACTIVE/IN_PROCESS/SELECTED) with no row update in the last daysThreshold days. */
  private async getHrStuckCandidates(hrId: number, daysThreshold = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const rows = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .innerJoin('candidate_stages', 's', 's.id = rc.stage_id')
      .innerJoin('candidates', 'c', 'c.id = rc.candidate_id')
      .select('rc.id', 'requirementCandidateId')
      .addSelect('c.full_name', 'candidateName')
      .addSelect('s.name', 'stageName')
      .addSelect('DATEDIFF(CURDATE(), rc.updated_at)', 'daysInStage')
      .where('r.assigned_hr_id = :hrId', { hrId })
      .andWhere('rc.status IN (:...statuses)', {
        statuses: [
          RequirementCandidateStatus.ACTIVE,
          RequirementCandidateStatus.IN_PROCESS,
          RequirementCandidateStatus.SELECTED,
        ],
      })
      .andWhere('DATE(rc.updated_at) < :cutoff', { cutoff: cutoffStr })
      .getRawMany<{ requirementCandidateId: number; candidateName: string; stageName: string; daysInStage: string }>();
    return rows.map((row) => ({
      requirementCandidateId: row.requirementCandidateId,
      candidateName: row.candidateName ?? '',
      stageName: row.stageName ?? '',
      daysInStage: Number(row.daysInStage),
    }));
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private async getKpis(from: Date, to: Date, assignedHrId?: number): Promise<DashboardKpis> {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const activeReqQb = this.requirementRepo
      .createQueryBuilder('r')
      .where('r.status IN (:...statuses)', {
        statuses: [RequirementStatus.OPEN, RequirementStatus.PARTIALLY_CLOSED, RequirementStatus.REOPENED],
      });
    if (assignedHrId != null) {
      activeReqQb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const activeRequirements = await activeReqQb.getCount();

    const rcPipelineQb = this.rcRepo
      .createQueryBuilder('rc')
      .where('rc.status IN (:...statuses)', {
        statuses: [
          RequirementCandidateStatus.ACTIVE,
          RequirementCandidateStatus.IN_PROCESS,
          RequirementCandidateStatus.SELECTED,
        ],
      });
    if (assignedHrId != null) {
      rcPipelineQb.innerJoin('requirements', 'r', 'r.id = rc.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const totalCandidatesInPipeline = await rcPipelineQb.getCount();

    const joinedQb = this.rcRepo
      .createQueryBuilder('rc')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date BETWEEN :from AND :to', { from: fromStr, to: toStr });
    if (assignedHrId != null) {
      joinedQb.innerJoin('requirements', 'r', 'r.id = rc.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const joinedThisMonth = await joinedQb.getCount();

    const revenueQb = this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('invoices', 'i', 'i.id = p.invoice_id')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });
    if (assignedHrId != null) {
      revenueQb.innerJoin('requirements', 'r', 'r.id = i.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const revenueThisMonthResult = await revenueQb.getRawOne<{ total: string }>();
    const revenueThisMonth = Number(revenueThisMonthResult?.total ?? 0);

    const outstandingQb = this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'total')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.RAISED, InvoiceStatus.OVERDUE],
      })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });
    if (assignedHrId != null) {
      outstandingQb.innerJoin('requirements', 'r', 'r.id = i.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const outstandingResult = await outstandingQb.getRawOne<{ total: string }>();
    const outstandingAmount = Number(outstandingResult?.total ?? 0);

    const overdueQb = this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'total')
      .where('i.status = :status', { status: InvoiceStatus.OVERDUE });
    if (assignedHrId != null) {
      overdueQb.innerJoin('requirements', 'r', 'r.id = i.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const overdueResult = await overdueQb.getRawOne<{ total: string }>();
    const overdueAmount = Number(overdueResult?.total ?? 0);

    const avgClosureQb = this.rcRepo
      .createQueryBuilder('rc')
      .select('AVG(GREATEST(0, DATEDIFF(rc.joining_date, rc.created_at)))', 'avgDays')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date IS NOT NULL');
    if (assignedHrId != null) {
      avgClosureQb.innerJoin('requirements', 'r', 'r.id = rc.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const avgClosureResult = await avgClosureQb.getRawOne<{ avgDays: string | null }>();
    const avgTimeToCloseDays = Math.round(Number(avgClosureResult?.avgDays ?? 0));

    return {
      activeRequirements,
      totalCandidatesInPipeline,
      joinedThisMonth,
      revenueThisMonth,
      outstandingAmount,
      overdueAmount,
      avgTimeToCloseDays,
    };
  }

  private async getRevenue(from: Date, to: Date, assignedHrId?: number): Promise<DashboardRevenue> {
    const toStr = to.toISOString().slice(0, 10);
    const fiveMonthsAgo = new Date(to);
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    const fromTrend = fiveMonthsAgo.toISOString().slice(0, 10);

    const monthlyQb = this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('invoices', 'i', 'i.id = p.invoice_id')
      .select("DATE_FORMAT(p.payment_date, '%Y-%m')", 'monthKey')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.payment_date BETWEEN :from AND :to', {
        from: fromTrend,
        to: toStr,
      })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });
    if (assignedHrId != null) {
      monthlyQb.innerJoin('requirements', 'r', 'r.id = i.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const monthlyRows = await monthlyQb
      .groupBy('monthKey')
      .orderBy('monthKey', 'ASC')
      .getRawMany<{ monthKey: string; amount: string }>();

    const monthlyTrend = monthlyRows.map((row) => {
      const [y, m] = row.monthKey.split('-').map(Number);
      return {
        month: MONTH_NAMES[m - 1],
        amount: Number(row.amount),
      };
    });

    const fromStr = from.toISOString().slice(0, 10);
    const topClientsQb = this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('invoices', 'i', 'i.id = p.invoice_id')
      .innerJoin('requirements', 'r', 'r.id = i.requirement_id')
      .innerJoin('clients', 'c', 'c.id = r.client_id')
      .select('c.company_name', 'clientName')
      .addSelect('SUM(p.amount)', 'revenue')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });
    if (assignedHrId != null) {
      topClientsQb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const topClientsRows = await topClientsQb
      .groupBy('c.id')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany<{ clientName: string; revenue: string }>();

    const topClients = topClientsRows.map((row) => ({
      clientName: row.clientName,
      revenue: Number(row.revenue),
    }));

    return { monthlyTrend, topClients };
  }

  private async getPipeline(_from: Date, _to: Date, assignedHrId?: number): Promise<DashboardPipeline> {
    const stageQb = this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('candidate_stages', 's', 's.id = rc.stage_id')
      .select('s.name', 'stage')
      .addSelect('COUNT(rc.id)', 'count')
      .groupBy('s.id')
      .addGroupBy('s.name');
    if (assignedHrId != null) {
      stageQb.innerJoin('requirements', 'r', 'r.id = rc.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const stageRows = await stageQb.getRawMany<{ stage: string; count: string }>();

    const stageDistribution = stageRows.map((row) => ({
      stage: row.stage,
      count: Number(row.count),
    }));

    const statusQb = this.requirementRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('r.status');
    if (assignedHrId != null) {
      statusQb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const statusRows = await statusQb.getRawMany<{ status: string; count: string }>();

    const requirementStatus = statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));

    return { stageDistribution, requirementStatus };
  }

  private async getHrPerformance(from: Date, to: Date, assignedHrId?: number): Promise<HrPerformanceItem[]> {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const reqCountQb = this.requirementRepo
      .createQueryBuilder('r')
      .innerJoin('users', 'u', 'u.id = r.assigned_hr_id')
      .select('u.id', 'hrId')
      .addSelect('u.name', 'hrName')
      .addSelect('COUNT(r.id)', 'requirementsHandled')
      .groupBy('u.id')
      .addGroupBy('u.name');
    if (assignedHrId != null) {
      reqCountQb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const reqCountByHr = await reqCountQb.getRawMany<{ hrId: number; hrName: string; requirementsHandled: string }>();

    if (reqCountByHr.length === 0) {
      return [];
    }

    const hrIds = reqCountByHr.map((r) => r.hrId);
    const joinedByHr = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .select('r.assigned_hr_id', 'hrId')
      .addSelect('COUNT(rc.id)', 'joined')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('r.assigned_hr_id IN (:...hrIds)', { hrIds })
      .groupBy('r.assigned_hr_id')
      .getRawMany<{ hrId: number; joined: string }>();

    const revenueByHr = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('invoices', 'i', 'i.id = p.invoice_id')
      .innerJoin('requirements', 'r', 'r.id = i.requirement_id')
      .select('r.assigned_hr_id', 'hrId')
      .addSelect('SUM(p.amount)', 'revenue')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .andWhere('r.assigned_hr_id IN (:...hrIds)', { hrIds })
      .groupBy('r.assigned_hr_id')
      .getRawMany<{ hrId: number; revenue: string }>();

    const avgDaysByHr = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .select('r.assigned_hr_id', 'hrId')
      .addSelect('AVG(GREATEST(0, DATEDIFF(rc.joining_date, rc.created_at)))', 'avgClosureDays')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date IS NOT NULL')
      .andWhere('r.assigned_hr_id IN (:...hrIds)', { hrIds })
      .groupBy('r.assigned_hr_id')
      .getRawMany<{ hrId: number; avgClosureDays: string | null }>();

    const joinedMap = new Map(joinedByHr.map((x) => [x.hrId, Number(x.joined)]));
    const revenueMap = new Map(revenueByHr.map((x) => [x.hrId, Number(x.revenue)]));
    const avgDaysMap = new Map(
      avgDaysByHr.map((x) => [x.hrId, Math.round(Number(x.avgClosureDays ?? 0))]),
    );

    return reqCountByHr.map((row) => ({
      hrId: row.hrId,
      hrName: row.hrName,
      requirementsHandled: Number(row.requirementsHandled),
      joined: joinedMap.get(row.hrId) ?? 0,
      revenue: revenueMap.get(row.hrId) ?? 0,
      avgClosureDays: avgDaysMap.get(row.hrId) ?? 0,
    }));
  }

  private async getFinance(_from: Date, _to: Date, assignedHrId?: number): Promise<DashboardFinance> {
    const today = new Date().toISOString().slice(0, 10);

    const agingQb = this.invoiceRepo
      .createQueryBuilder('i')
      .select(
        `CASE
          WHEN DATEDIFF(:today, i.due_date) BETWEEN 0 AND 30 THEN '0_30'
          WHEN DATEDIFF(:today, i.due_date) BETWEEN 31 AND 60 THEN '31_60'
          WHEN DATEDIFF(:today, i.due_date) > 60 THEN '60_plus'
          ELSE NULL
        END`,
        'bucket',
      )
      .addSelect('COALESCE(SUM(i.total_amount), 0)', 'amount')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.RAISED, InvoiceStatus.OVERDUE],
      })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .andWhere('i.due_date <= :today', { today });
    if (assignedHrId != null) {
      agingQb.innerJoin('requirements', 'r', 'r.id = i.requirement_id').andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const agingRows = await agingQb.groupBy('bucket').getRawMany<{ bucket: string; amount: string }>();

    const aging: DashboardFinance['aging'] = {
      '0_30': 0,
      '31_60': 0,
      '60_plus': 0,
    };
    for (const row of agingRows) {
      if (row.bucket && row.bucket in aging) {
        aging[row.bucket as keyof typeof aging] = Number(row.amount);
      }
    }

    const upcomingQb = this.invoiceRepo
      .createQueryBuilder('i')
      .innerJoin('requirements', 'r', 'r.id = i.requirement_id')
      .innerJoin('clients', 'c', 'c.id = r.client_id')
      .select('i.invoice_number', 'invoiceNumber')
      .addSelect('i.due_date', 'dueDate')
      .addSelect('i.total_amount', 'totalAmount')
      .addSelect('c.company_name', 'clientName')
      .where('i.status = :raised', { raised: InvoiceStatus.RAISED })
      .orderBy('i.due_date', 'ASC')
      .limit(20);
    if (assignedHrId != null) {
      upcomingQb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const upcomingRows = await upcomingQb.getRawMany<{
      invoiceNumber: string;
      dueDate: string | Date;
      totalAmount: string;
      clientName: string;
    }>();
    const dueAfterToday = upcomingRows.filter(
      (row) => new Date(row.dueDate) >= new Date(today),
    );
    const upcomingDueInvoices = dueAfterToday.slice(0, 10).map((row) => ({
      invoiceNumber: row.invoiceNumber,
      clientName: row.clientName ?? '',
      dueDate: typeof row.dueDate === 'string' ? row.dueDate.slice(0, 10) : new Date(row.dueDate).toISOString().slice(0, 10),
      amount: Number(row.totalAmount),
    }));

    return {
      aging,
      upcomingDueInvoices,
    };
  }

  private async getReplacementRisk(assignedHrId?: number): Promise<ReplacementRiskItem[]> {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const qb = this.rcRepo
      .createQueryBuilder('rc')
      .leftJoin('candidates', 'c', 'c.id = rc.candidate_id')
      .leftJoin('requirements', 'r', 'r.id = rc.requirement_id')
      .leftJoin('clients', 'cl', 'cl.id = r.client_id')
      .select('rc.status', 'status')
      .addSelect('rc.replacement_due_date', 'replacementDueDate')
      .addSelect('c.full_name', 'candidateName')
      .addSelect('cl.company_name', 'clientName')
      .where('rc.replacement_flag = 1')
      .orderBy('rc.replacement_due_date', 'ASC');
    if (assignedHrId != null) {
      qb.andWhere('r.assigned_hr_id = :hrId', { hrId: assignedHrId });
    }
    const rows = await qb.getRawMany<{
      status: string;
      replacementDueDate: string | Date | null;
      candidateName: string | null;
      clientName: string | null;
    }>();

    const todayDate = new Date(todayStr);
    return rows
      .filter((row) => row.status !== RequirementCandidateStatus.DROPPED && row.status !== RequirementCandidateStatus.ABSCONDED)
      .filter((row) => {
        if (row.replacementDueDate == null) return false;
        const due = row.replacementDueDate instanceof Date ? row.replacementDueDate : new Date(String(row.replacementDueDate));
        return !isNaN(due.getTime()) && due >= todayDate;
      })
      .map((row) => {
        const due =
          row.replacementDueDate instanceof Date
            ? row.replacementDueDate
            : new Date(String(row.replacementDueDate));
        const daysRemaining = Math.ceil(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          candidateName: row.candidateName ?? '',
          clientName: row.clientName ?? '',
          replacementDueDate: due.toISOString().slice(0, 10),
          daysRemaining: Math.max(0, daysRemaining),
        };
      });
  }
}
