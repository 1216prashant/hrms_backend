import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from 'src/database/entities/payment.entity';
import { Invoice, InvoiceStatus } from 'src/database/entities/invoice.entity';
import { User } from 'src/database/entities/user.entity';

type PaymentCreateDto = Partial<Payment> & {
  invoice_id: number;
};

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private repo: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
  ) {}

  /**
   * Recalculates amount_paid (sum of all payments) and balance_due (total_amount - amount_paid)
   * for the given invoice and updates status to PAID when balance_due <= 0.
   */
  async recalculateInvoiceAmounts(invoiceId: number): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) return;

    const payments = await this.repo.find({
      where: { invoice: { id: invoiceId } },
    });
    const amountPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount ?? 0),
      0,
    );
    const totalAmount = Number(invoice.totalAmount ?? 0);
    const balanceDue = Math.round((totalAmount - amountPaid) * 100) / 100;

    invoice.amountPaid = Math.round(amountPaid * 100) / 100;
    invoice.balanceDue = balanceDue;
    if (balanceDue <= 0) {
      invoice.status = InvoiceStatus.PAID;
    } else if (amountPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    } else {
      invoice.status = InvoiceStatus.RAISED;
    }
    await this.invoiceRepo.save(invoice);
  }

  async create(data: PaymentCreateDto, userId?: number) {
    const { invoice_id, ...rest } = data;

    if (invoice_id == null) {
      throw new BadRequestException('invoice_id is required');
    }

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoice_id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${invoice_id} not found`);
    }

    const payment = this.repo.create({
      ...rest,
      invoice,
      ...(userId != null && {
        createdByUser: { id: userId } as User,
        updatedByUser: { id: userId } as User,
      }),
    });
    const saved = await this.repo.save(payment);

    await this.recalculateInvoiceAmounts(invoice_id);

    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
    });
  }

  async update(data: Partial<PaymentCreateDto>, id: number, userId?: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
    });
    if (!existing) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    const { invoice_id, ...rest } = data;
    const previousInvoiceId = existing.invoice?.id;

    if (invoice_id != null) {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoice_id } });
      if (!invoice) {
        throw new NotFoundException(`Invoice with id ${invoice_id} not found`);
      }
      existing.invoice = invoice;
    }

    Object.assign(existing, rest);
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    await this.repo.save(existing);

    await this.recalculateInvoiceAmounts(existing.invoice.id);
    if (
      previousInvoiceId != null &&
      previousInvoiceId !== existing.invoice.id
    ) {
      await this.recalculateInvoiceAmounts(previousInvoiceId);
    }

    return this.repo.findOne({
      where: { id },
      relations: ['invoice'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
    });
  }

  async remove(id: number, userId?: number) {
    const payment = await this.repo.findOne({
      where: { id },
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    const invoiceId = payment.invoice?.id;
    if (userId != null) {
      payment.updatedByUser = { id: userId } as User;
    }
    payment.isDeleted = true;
    await this.repo.save(payment);
    if (invoiceId != null) {
      await this.recalculateInvoiceAmounts(invoiceId);
    }
  }

  findByInvoiceId(invoiceId: number) {
    return this.repo.find({
      where: { invoice: { id: invoiceId } },
      relations: ['invoice', 'createdByUser', 'updatedByUser'],
      order: { id: 'ASC' },
    });
  }
}
