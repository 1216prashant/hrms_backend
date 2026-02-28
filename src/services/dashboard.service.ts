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

  async getDashboard(from?: string, to?: string): Promise<DashboardResponse> {
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
      this.getKpis(filterFrom, filterTo),
      this.getRevenue(filterFrom, filterTo),
      this.getPipeline(filterFrom, filterTo),
      this.getHrPerformance(filterFrom, filterTo),
      this.getFinance(filterFrom, filterTo),
      this.getReplacementRisk(),
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

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private async getKpis(from: Date, to: Date): Promise<DashboardKpis> {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const activeRequirements = await this.requirementRepo.count({
      where: [
        { status: RequirementStatus.OPEN },
        { status: RequirementStatus.PARTIALLY_CLOSED },
        { status: RequirementStatus.REOPENED },
      ],
    });

    const totalCandidatesInPipeline = await this.rcRepo
      .createQueryBuilder('rc')
      .where('rc.status IN (:...statuses)', {
        statuses: [
          RequirementCandidateStatus.ACTIVE,
          RequirementCandidateStatus.IN_PROCESS,
          RequirementCandidateStatus.SELECTED,
        ],
      })
      .getCount();

    const joinedThisMonth = await this.rcRepo
      .createQueryBuilder('rc')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .getCount();

    const revenueThisMonthResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .getRawOne<{ total: string }>();
    const revenueThisMonth = Number(revenueThisMonthResult?.total ?? 0);

    const outstandingResult = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'total')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.RAISED, InvoiceStatus.OVERDUE],
      })
      .getRawOne<{ total: string }>();
    const outstandingAmount = Number(outstandingResult?.total ?? 0);

    const overdueResult = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'total')
      .where('i.status = :status', { status: InvoiceStatus.OVERDUE })
      .getRawOne<{ total: string }>();
    const overdueAmount = Number(overdueResult?.total ?? 0);

    const avgClosureResult = await this.rcRepo
      .createQueryBuilder('rc')
      .select('AVG(DATEDIFF(rc.joining_date, rc.created_at))', 'avgDays')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date IS NOT NULL')
      .getRawOne<{ avgDays: string | null }>();
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

  private async getRevenue(from: Date, to: Date): Promise<DashboardRevenue> {
    const toStr = to.toISOString().slice(0, 10);
    const fiveMonthsAgo = new Date(to);
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    const fromTrend = fiveMonthsAgo.toISOString().slice(0, 10);

    const monthlyRows = await this.paymentRepo
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.payment_date, '%Y-%m')", 'monthKey')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.payment_date BETWEEN :from AND :to', {
        from: fromTrend,
        to: toStr,
      })
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
    const topClientsRows = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('p.invoice', 'i')
      .innerJoin('i.requirement', 'r')
      .innerJoin('r.client', 'c')
      .select('c.company_name', 'clientName')
      .addSelect('SUM(p.amount)', 'revenue')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
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

  private async getPipeline(_from: Date, _to: Date): Promise<DashboardPipeline> {
    const stageRows = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('rc.stage', 's')
      .select('s.name', 'stage')
      .addSelect('COUNT(rc.id)', 'count')
      .groupBy('s.id')
      .addGroupBy('s.name')
      .getRawMany<{ stage: string; count: string }>();

    const stageDistribution = stageRows.map((row) => ({
      stage: row.stage,
      count: Number(row.count),
    }));

    const statusRows = await this.requirementRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: string; count: string }>();

    const requirementStatus = statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));

    return { stageDistribution, requirementStatus };
  }

  private async getHrPerformance(from: Date, to: Date): Promise<HrPerformanceItem[]> {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const reqCountByHr = await this.requirementRepo
      .createQueryBuilder('r')
      .leftJoin('r.assignedHr', 'u')
      .select('u.id', 'hrId')
      .addSelect('u.name', 'hrName')
      .addSelect('COUNT(r.id)', 'requirementsHandled')
      .where('u.id IS NOT NULL')
      .groupBy('u.id')
      .addGroupBy('u.name')
      .getRawMany<{ hrId: number; hrName: string; requirementsHandled: string }>();

    if (reqCountByHr.length === 0) {
      return [];
    }

    const hrIds = reqCountByHr.map((r) => r.hrId);
    const joinedByHr = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('rc.requirement', 'r')
      .innerJoin('r.assignedHr', 'u')
      .select('u.id', 'hrId')
      .addSelect('COUNT(rc.id)', 'joined')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('u.id IN (:...hrIds)', { hrIds })
      .groupBy('u.id')
      .getRawMany<{ hrId: number; joined: string }>();

    const revenueByHr = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('p.invoice', 'i')
      .innerJoin('i.requirement', 'r')
      .innerJoin('r.assignedHr', 'u')
      .select('u.id', 'hrId')
      .addSelect('SUM(p.amount)', 'revenue')
      .where('p.payment_date BETWEEN :from AND :to', { from: fromStr, to: toStr })
      .andWhere('u.id IN (:...hrIds)', { hrIds })
      .groupBy('u.id')
      .getRawMany<{ hrId: number; revenue: string }>();

    const avgDaysByHr = await this.rcRepo
      .createQueryBuilder('rc')
      .innerJoin('rc.requirement', 'r')
      .innerJoin('r.assignedHr', 'u')
      .select('u.id', 'hrId')
      .addSelect('AVG(DATEDIFF(rc.joining_date, rc.created_at))', 'avgClosureDays')
      .where('rc.status = :joined', { joined: RequirementCandidateStatus.JOINED })
      .andWhere('rc.joining_date IS NOT NULL')
      .andWhere('u.id IN (:...hrIds)', { hrIds })
      .groupBy('u.id')
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

  private async getFinance(_from: Date, _to: Date): Promise<DashboardFinance> {
    const today = new Date().toISOString().slice(0, 10);

    const agingRows = await this.invoiceRepo
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
      .andWhere('i.due_date <= :today', { today })
      .groupBy('bucket')
      .getRawMany<{ bucket: string; amount: string }>();

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

    const invoicesWithClient = await this.invoiceRepo.find({
      where: { status: InvoiceStatus.RAISED },
      relations: ['requirement', 'requirement.client'],
      order: { dueDate: 'ASC' },
      take: 20,
    });
    const dueAfterToday = invoicesWithClient.filter(
      (i) => new Date(i.dueDate) >= new Date(today),
    );
    const upcomingDueInvoices = dueAfterToday.slice(0, 10).map((i) => ({
      invoiceNumber: i.invoiceNumber,
      clientName: i.requirement?.client?.companyName ?? '',
      dueDate: (i.dueDate as Date).toISOString?.()?.slice(0, 10) ?? String(i.dueDate),
      amount: Number(i.totalAmount),
    }));

    return {
      aging,
      upcomingDueInvoices,
    };
  }

  private async getReplacementRisk(): Promise<ReplacementRiskItem[]> {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const rows = await this.rcRepo.find({
      where: {
        replacementFlag: 1,
      },
      relations: ['candidate', 'requirement', 'requirement.client'],
      order: { replacementDueDate: 'ASC' },
    });

    return rows
      .filter((rc) => rc.replacementDueDate && new Date(rc.replacementDueDate) >= today)
      .map((rc) => {
        const due = rc.replacementDueDate ? new Date(rc.replacementDueDate) : today;
        const daysRemaining = Math.ceil(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          candidateName: rc.candidate?.fullName ?? '',
          clientName: rc.requirement?.client?.companyName ?? '',
          replacementDueDate: due.toISOString().slice(0, 10),
          daysRemaining: Math.max(0, daysRemaining),
        };
      });
  }
}
