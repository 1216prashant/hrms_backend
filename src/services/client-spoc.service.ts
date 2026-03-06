import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { Client } from "src/database/entities/client.entity";
import { User } from "src/database/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class ClientSpocService {

  constructor(
    @InjectRepository(ClientSpoc)
    private repo: Repository<ClientSpoc>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async create(data: Partial<ClientSpoc> & { client_id?: string | number }, userId?: number) {
    const { client_id, ...rest } = data as Partial<ClientSpoc> & { client_id?: string | number };
    const rawId = client_id != null ? client_id : (data.client as unknown as Client)?.id;
    if (rawId == null) {
      throw new BadRequestException('client_id is required');
    }
    const clientId = Number(rawId);
    if (!Number.isInteger(clientId)) {
      throw new BadRequestException('client_id must be a valid number');
    }
    const clientExists = await this.clientRepo.findOne({ where: { id: clientId, isDeleted: false } });
    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }
    const clientSpoc = this.repo.create({
      ...rest,
      client: { id: clientId },
      ...(userId != null && {
        createdByUser: { id: userId } as User,
        updatedByUser: { id: userId } as User,
      }),
    });
    return this.repo.save(clientSpoc);
  }

  async update(data: Partial<ClientSpoc> & { client_id?: string | number }, id: string, userId?: number) {
    const existing = await this.repo.findOne({ where: { id, isDeleted: false }, relations: ['client'] });
    if (!existing) {
      throw new NotFoundException(`Client Spoc with id ${id} not found`);
    }
    const { client_id, ...rest } = data as Partial<ClientSpoc> & { client_id?: string | number };
    if (client_id != null) {
      const clientId = Number(client_id);
      if (!Number.isInteger(clientId)) {
        throw new BadRequestException('client_id must be a valid number');
      }
      const clientExists = await this.clientRepo.findOne({ where: { id: clientId, isDeleted: false } });
      if (!clientExists) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }
      existing.client = { id: clientId } as Client;
    }
    Object.assign(existing, rest);
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    return this.repo.save(existing);
  }

  findAll() {
    return this.repo.find({ where: { isDeleted: false }, relations: ['client', 'createdByUser', 'updatedByUser'] });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id: id, isDeleted: false },
      relations: ['client', 'createdByUser', 'updatedByUser'],
    });
  }

  async remove(id: string, userId?: number) {
    const existing = await this.repo.findOne({ where: { id: id, isDeleted: false } });
    if (!existing) {
      throw new NotFoundException(`Client Spoc with id ${id} not found`);
    }
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    existing.isDeleted = true;
    return this.repo.save(existing);
  }
  findByClientId(id: string | number) {
    const clientId = Number(id);
    return this.repo.find({
      where: { client: { id: clientId }, isDeleted: false },
      relations: ['client'],
    });
  }
}