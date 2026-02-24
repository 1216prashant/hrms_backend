import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from 'src/database/entities/payment.entity';
import { Invoice, InvoiceStatus } from 'src/database/entities/invoice.entity';

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

  async create(data: PaymentCreateDto) {
    const { invoice_id, ...rest } = data;

    if (invoice_id == null) {
      throw new BadRequestException('invoice_id is required');
    }

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoice_id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${invoice_id} not found`);
    }

    const existing = await this.repo.findOne({ where: { invoice: { id: invoice_id } } });
    if (existing) {
      throw new ConflictException(`Payment already exists for invoice ${invoice_id}`);
    }

    const payment = this.repo.create({
      ...rest,
      invoice,
    });
    const saved = await this.repo.save(payment);

    invoice.status = InvoiceStatus.PAID;
    await this.invoiceRepo.save(invoice);

    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['invoice'],
    });
  }

  async update(data: Partial<PaymentCreateDto>, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!existing) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    const { invoice_id, ...rest } = data;

    if (invoice_id != null) {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoice_id } });
      if (!invoice) {
        throw new NotFoundException(`Invoice with id ${invoice_id} not found`);
      }
      existing.invoice = invoice;
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['invoice'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['invoice'],
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['invoice'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  findByInvoiceId(invoiceId: number) {
    return this.repo.findOne({
      where: { invoice: { id: invoiceId } },
      relations: ['invoice'],
    });
  }
}
