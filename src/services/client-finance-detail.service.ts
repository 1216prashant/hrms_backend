import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientFinanceDetail } from 'src/database/entities/client-finance-detail.entity';
import { Client } from 'src/database/entities/client.entity';

type ClientFinanceDetailCreateDto = Partial<ClientFinanceDetail> & {
  client_id: number;
};

@Injectable()
export class ClientFinanceDetailService {
  constructor(
    @InjectRepository(ClientFinanceDetail)
    private repo: Repository<ClientFinanceDetail>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async create(data: ClientFinanceDetailCreateDto) {
    const { client_id, ...rest } = data;

    if (client_id == null) {
      throw new BadRequestException('client_id is required');
    }

    const client = await this.clientRepo.findOne({ where: { id: client_id } });
    if (!client) {
      throw new NotFoundException(`Client with id ${client_id} not found`);
    }

    const existing = await this.repo.findOne({ where: { client: { id: client_id } } });
    if (existing) {
      throw new BadRequestException(
        `Finance details already exist for client ${client_id}. Use update instead.`,
      );
    }

    const detail = this.repo.create({
      ...rest,
      client,
    });
    const saved = await this.repo.save(detail);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['client'],
    });
  }

  async update(data: Partial<ClientFinanceDetailCreateDto>, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!existing) {
      throw new NotFoundException(`Client finance detail with id ${id} not found`);
    }

    const { client_id, ...rest } = data;

    if (client_id != null) {
      const client = await this.clientRepo.findOne({ where: { id: client_id } });
      if (!client) {
        throw new NotFoundException(`Client with id ${client_id} not found`);
      }
      existing.client = client;
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['client'],
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  findByClientId(clientId: string | number) {
    const id = Number(clientId);
    return this.repo.findOne({
      where: { client: { id } },
      relations: ['client'],
    });
  }
}
