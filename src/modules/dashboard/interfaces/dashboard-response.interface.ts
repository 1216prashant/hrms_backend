export interface DashboardFilters {
  from: string;
  to: string;
}

export interface DashboardKpis {
  activeRequirements: number;
  totalCandidatesInPipeline: number;
  joinedThisMonth: number;
  revenueThisMonth: number;
  outstandingAmount: number;
  overdueAmount: number;
  avgTimeToCloseDays: number;
}

export interface MonthlyRevenueItem {
  month: string;
  amount: number;
}

export interface TopClientItem {
  clientName: string;
  revenue: number;
}

export interface DashboardRevenue {
  monthlyTrend: MonthlyRevenueItem[];
  topClients: TopClientItem[];
}

export interface StageDistributionItem {
  stage: string;
  count: number;
}

export interface RequirementStatusItem {
  status: string;
  count: number;
}

export interface DashboardPipeline {
  stageDistribution: StageDistributionItem[];
  requirementStatus: RequirementStatusItem[];
}

export interface HrPerformanceItem {
  hrId: number;
  hrName: string;
  requirementsHandled: number;
  joined: number;
  revenue: number;
  avgClosureDays: number;
}

export interface FinanceAging {
  '0_30': number;
  '31_60': number;
  '60_plus': number;
}

export interface UpcomingDueInvoice {
  invoiceNumber: string;
  clientName: string;
  dueDate: string;
  amount: number;
}

export interface DashboardFinance {
  aging: FinanceAging;
  upcomingDueInvoices: UpcomingDueInvoice[];
}

export interface ReplacementRiskItem {
  candidateName: string;
  clientName: string;
  replacementDueDate: string;
  daysRemaining: number;
}

export interface DashboardResponse {
  success: true;
  filters: DashboardFilters;
  kpis: DashboardKpis;
  revenue: DashboardRevenue;
  pipeline: DashboardPipeline;
  hrPerformance: HrPerformanceItem[];
  finance: DashboardFinance;
  replacementRisk: ReplacementRiskItem[];
}
