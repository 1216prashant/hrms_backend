import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from 'src/database/entities/invoice.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { RequirementCandidateStatus } from 'src/database/entities/requirement-candidate.entity';
import { BillingModel } from 'src/database/entities/requirement.entity';
import { InvoiceStatus } from 'src/database/entities/invoice.entity';
import { ClientAgreement } from 'src/database/entities/client-agreement.entity';
import { AgreementBillingModel } from 'src/database/entities/client-agreement.entity';

const GST_RATE = 0.18;
const DUE_DAYS_AFTER_INVOICE = 30;

type InvoiceCreateDto = Partial<Invoice> & {
  requirement_id: number;
  candidate_id: number;
};

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private repo: Repository<Invoice>,
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(RequirementCandidate)
    private requirementCandidateRepo: Repository<RequirementCandidate>,
    @InjectRepository(ClientAgreement)
    private clientAgreementRepo: Repository<ClientAgreement>,
  ) {}

  async create(data: InvoiceCreateDto) {
    const { requirement_id, candidate_id, ...rest } = data;

    if (requirement_id == null) {
      throw new BadRequestException('requirement_id is required');
    }
    if (candidate_id == null) {
      throw new BadRequestException('candidate_id is required');
    }

    const [requirement, candidate] = await Promise.all([
      this.requirementRepo.findOne({ where: { id: requirement_id } }),
      this.candidateRepo.findOne({ where: { id: candidate_id } }),
    ]);
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
    }
    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${candidate_id} not found`);
    }

    const total = Number((rest as Partial<Invoice>).totalAmount ?? 0);
    const invoice = this.repo.create({
      ...rest,
      requirement,
      candidate,
      amountPaid: (rest as Partial<Invoice>).amountPaid ?? 0,
      balanceDue: (rest as Partial<Invoice>).balanceDue ?? total,
    });
    const saved = await this.repo.save(invoice);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['requirement', 'candidate'],
    });
  }

  async update(data: Partial<InvoiceCreateDto>, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
    if (!existing) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    const { requirement_id, candidate_id, ...rest } = data;

    if (requirement_id != null) {
      const requirement = await this.requirementRepo.findOne({ where: { id: requirement_id } });
      if (!requirement) {
        throw new NotFoundException(`Requirement with id ${requirement_id} not found`);
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

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['requirement', 'candidate'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  findByRequirementId(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findByCandidateId(candidateId: number) {
    return this.repo.find({
      where: { candidate: { id: candidateId } },
      relations: ['requirement', 'candidate'],
      order: { id: 'ASC' },
    });
  }

  findByClientId(clientId: string | number) {
    const id = Number(clientId);
    return this.repo.find({
      where: { requirement: { client: { id } } },
      relations: ['requirement', 'candidate', 'requirement.client'],
      order: { id: 'ASC' },
    });
  }

  /**
   * When a requirement is closed, creates invoice entries for each JOINED candidate
   * based on clawback period (invoice date = joining date + clawback days),
   * billing model (from requirement if overrideBillingModel, else from client agreement),
   * and calculates GST at 18% on amount before tax.
   */
  async createInvoicesForClosedRequirement(requirementId: number): Promise<Invoice[]> {
    const requirement = await this.requirementRepo.findOne({
      where: { id: requirementId },
      relations: ['client'],
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement with id ${requirementId} not found`);
    }

    const clawbackDays = requirement.clawbackPeriod ?? 90;
    const joinedCandidates = await this.requirementCandidateRepo.find({
      where: {
        requirement: { id: requirementId },
        status: RequirementCandidateStatus.JOINED,
      },
      relations: ['requirement', 'candidate'],
    });

    const created: Invoice[] = [];
    for (const rc of joinedCandidates) {
      if (rc.joiningDate == null) {
        continue;
      }
      const existing = await this.repo.findOne({
        where: {
          requirement: { id: requirementId },
          candidate: { id: rc.candidate.id },
        },
      });
      if (existing) {
        continue;
      }

      const invoiceDate = this.addDays(rc.joiningDate, clawbackDays);
      const baseCtc = rc.finalCtc != null ? Number(rc.finalCtc) : (rc.offeredCtc != null ? Number(rc.offeredCtc) : 0);
      let amountBeforeTax: number;
      let feePercentage: number | null = null;
      let fixedFee: number | null = null;
      let billingModel: BillingModel;
      let agreementForCredit: ClientAgreement | null = null;

      if (requirement.overrideBillingModel) {
        billingModel = requirement.billingModel;
        if (requirement.billingModel === BillingModel.FIXED && requirement.fixedFee != null) {
          amountBeforeTax = Number(requirement.fixedFee);
          fixedFee = amountBeforeTax;
        } else if (requirement.billingModel === BillingModel.PERCENTAGE && requirement.percentageFee != null) {
          const pct = Number(requirement.percentageFee);
          feePercentage = pct;
          amountBeforeTax = Math.round((baseCtc * pct) / 100 * 100) / 100;
        } else {
          continue;
        }
        agreementForCredit = await this.getEffectiveClientAgreement(
          requirement.client?.id,
          invoiceDate,
        );
      } else {
        const agreement = await this.getEffectiveClientAgreement(
          requirement.client?.id,
          invoiceDate,
        );
        if (!agreement) {
          throw new BadRequestException(
            `No active client agreement found for client (requirement ${requirementId}). Add an agreement effective on invoice date.`,
          );
        }
        agreementForCredit = agreement;
        const { model, amount, feePct, feeFixed } = this.resolveBillingFromAgreement(agreement, baseCtc);
        billingModel = model;
        amountBeforeTax = amount;
        feePercentage = feePct;
        fixedFee = feeFixed;
        if (amountBeforeTax == null || amountBeforeTax < 0) {
          continue;
        }
      }

      const creditPeriodDays = agreementForCredit?.creditPeriodDays != null
        ? Number(agreementForCredit.creditPeriodDays)
        : DUE_DAYS_AFTER_INVOICE;
      const gstAmount = Math.round(amountBeforeTax * GST_RATE * 100) / 100;
      const totalAmount = Math.round((amountBeforeTax + gstAmount) * 100) / 100;
      const dueDate = this.addDays(invoiceDate, creditPeriodDays);
      let invoiceNumber = await this.getNextInvoiceNumber(invoiceDate);
      const isDuplicateKey = (err: unknown): boolean =>
        (err as { code?: string }).code === 'ER_DUP_ENTRY' ||
        String((err as { message?: string }).message ?? '').includes('Duplicate entry');

      let saved: Invoice | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const invoice = this.repo.create({
          requirement: rc.requirement,
          candidate: rc.candidate,
          invoiceNumber,
          billingModel,
          baseCtc: baseCtc || null,
          feePercentage,
          fixedFee,
          amountBeforeTax,
          gstAmount,
          totalAmount,
          invoiceDate,
          dueDate,
          status: InvoiceStatus.RAISED,
          amountPaid: 0,
          balanceDue: totalAmount,
        });
        try {
          saved = await this.repo.save(invoice);
          break;
        } catch (err) {
          if (attempt === 0 && isDuplicateKey(err)) {
            invoiceNumber = await this.getNextInvoiceNumber(invoiceDate);
            continue;
          }
          throw err;
        }
      }
      if (saved) {
        const full = await this.repo.findOne({
          where: { id: saved.id },
          relations: ['requirement', 'candidate'],
        });
        if (full) created.push(full);
      }
    }
    return created;
  }

  /**
   * Returns the active client agreement effective on the given date (effectiveFrom <= date and effectiveTo >= date or null).
   */
  private async getEffectiveClientAgreement(
    clientId: number | undefined,
    date: Date,
  ): Promise<ClientAgreement | null> {
    if (clientId == null) return null;
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
    const list = await this.clientAgreementRepo.find({
      where: { client: { id: clientId }, isActive: true },
      order: { effectiveFrom: 'DESC' },
    });
    for (const a of list) {
      const from = a.effectiveFrom ? new Date(a.effectiveFrom).toISOString().slice(0, 10) : '';
      const to = a.effectiveTo ? new Date(a.effectiveTo).toISOString().slice(0, 10) : null;
      if (from <= dateStr && (to == null || to >= dateStr)) return a;
    }
    return null;
  }

  /**
   * Maps client agreement billing to invoice BillingModel and computes amount/fee fields.
   */
  private resolveBillingFromAgreement(
    agreement: ClientAgreement,
    baseCtc: number,
  ): { model: BillingModel; amount: number; feePct: number | null; feeFixed: number | null } {
    const model =
      agreement.billingModel === AgreementBillingModel.PERCENTAGE
        ? BillingModel.PERCENTAGE
        : agreement.billingModel === AgreementBillingModel.FIXED
          ? BillingModel.FIXED
          : agreement.percentageFee != null
            ? BillingModel.PERCENTAGE
            : BillingModel.FIXED;
    let amount: number;
    let feePct: number | null = null;
    let feeFixed: number | null = null;
    if (model === BillingModel.FIXED && agreement.fixedFee != null) {
      amount = Number(agreement.fixedFee);
      feeFixed = amount;
    } else if (model === BillingModel.PERCENTAGE && agreement.percentageFee != null) {
      const pct = Number(agreement.percentageFee);
      feePct = pct;
      amount = Math.round((baseCtc * pct) / 100 * 100) / 100;
    } else {
      amount = -1;
    }
    return { model, amount, feePct, feeFixed };
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Financial year: 1 April to 31 March. e.g. 2025-04-01 → 2025-26, 2026-01-15 → 2025-26.
   */
  private getFinancialYearString(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = Jan, 3 = Apr
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    const endSuffix = String(endYear).slice(-2);
    return `${startYear}-${endSuffix}`;
  }

  /**
   * Next invoice number in format PI/{financial-year}/HR/{seq}.
   * Sequence is incremental per financial year (001, 002, ...).
   * Uses getRawMany() so we reliably read invoice_number; getMany() + select can leave entity properties unset.
   */
  private async getNextInvoiceNumber(invoiceDate: Date): Promise<string> {
    const fy = this.getFinancialYearString(invoiceDate);
    const prefix = `PI/${fy}/HR/`;
    const rows = await this.repo
      .createQueryBuilder('i')
      .select('i.invoice_number', 'invoice_number')
      .where('i.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .getRawMany();
    let maxSeq = 0;
    for (const row of rows) {
      const raw =
        (row as Record<string, unknown>)?.invoice_number ??
        (row as Record<string, unknown>)?.i_invoice_number ??
        '';
      const num = String(raw).replace(prefix, '').trim();
      const seq = parseInt(num, 10);
      if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }
}
