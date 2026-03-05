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
  /** Outstanding amount not yet due (due_date in the future) */
  current: number;
  /** 0–30 days overdue */
  '0_30': number;
  /** 31–60 days overdue */
  '31_60': number;
  /** 60+ days overdue */
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

// HR dashboard (GET /dashboard/hr) response shape
export interface HrDashboardFilters {
  from: string;
  to: string;
}

export interface HrMyPerformance {
  hrId: number;
  hrName: string;
  activeRequirements: number;
  requirementsHandled: number;
  candidatesInPipeline: number;
  joinedThisMonth: number;
  offersReleased: number;
  avgClosureDays: number;
  conversionRate: number;
}

export interface HrPipeline {
  stageDistribution: { stage: string; count: number }[];
  candidateStatus: { status: string; count: number }[];
}

export interface HrOpenRequirement {
  requirementId: number;
  clientName: string;
  jobTitle: string;
  openPositions: number;
  daysOpen: number;
}

export interface HrRequirements {
  statusDistribution: { status: string; count: number }[];
  myOpenRequirements: HrOpenRequirement[];
}

export interface HrActivitySummary {
  candidatesAdded: number;
  interviewsScheduled: number;
  offersReleased: number;
  candidatesJoined: number;
}

export interface HrAlerts {
  replacementRisk: ReplacementRiskItem[];
  staleRequirements: unknown[];
  stuckCandidates: unknown[];
}

export interface HrDashboardData {
  filters: HrDashboardFilters;
  myPerformance: HrMyPerformance;
  pipeline: HrPipeline;
  requirements: HrRequirements;
  activitySummary: HrActivitySummary;
  alerts: HrAlerts;
}
