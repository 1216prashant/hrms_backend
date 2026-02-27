import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientAgreement } from 'src/database/entities/client-agreement.entity';
import { Client } from 'src/database/entities/client.entity';

type ClientAgreementCreateDto = Partial<ClientAgreement> & {
  client_id: number;
};

@Injectable()
export class ClientAgreementService {
  constructor(
    @InjectRepository(ClientAgreement)
    private repo: Repository<ClientAgreement>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async create(data: ClientAgreementCreateDto) {
    const { client_id, ...rest } = data;

    if (client_id == null) {
      throw new BadRequestException('client_id is required');
    }

    const client = await this.clientRepo.findOne({ where: { id: client_id } });
    if (!client) {
      throw new NotFoundException(`Client with id ${client_id} not found`);
    }

    const agreement = this.repo.create({
      ...rest,
      client,
    });
    const saved = await this.repo.save(agreement);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['client'],
    });
  }

  async update(data: Partial<ClientAgreementCreateDto>, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!existing) {
      throw new NotFoundException(`Client agreement with id ${id} not found`);
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
    return this.repo.find({
      where: { client: { id } },
      relations: ['client'],
      order: { id: 'ASC' },
    });
  }
}
