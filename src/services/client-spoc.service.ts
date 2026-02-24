import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { Client } from "src/database/entities/client.entity";
import { Repository } from "typeorm";

@Injectable()
export class ClientSpocService {

  constructor(
    @InjectRepository(ClientSpoc)
    private repo: Repository<ClientSpoc>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async create(data: Partial<ClientSpoc> & { client_id?: string | number }) {
    const { client_id, ...rest } = data as Partial<ClientSpoc> & { client_id?: string | number };
    const clientId = client_id != null ? String(client_id) : (data.client as unknown as Client)?.id;
    if (!clientId) {
      throw new BadRequestException('client_id is required');
    }
    const clientExists = await this.clientRepo.findOne({ where: { id: clientId } });
    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }
    const clientSpoc = this.repo.create({
      ...rest,
      client: { id: clientId },
    });
    return this.repo.save(clientSpoc);
  }

  async update(data: Partial<ClientSpoc> & { client_id?: string | number }, id: string) {
    const existing = await this.repo.findOne({ where: { id }, relations: ['client'] });
    if (!existing) {
      throw new NotFoundException(`Client Spoc with id ${id} not found`);
    }
    const { client_id, ...rest } = data as Partial<ClientSpoc> & { client_id?: string | number };
    if (client_id != null) {
      const clientId = String(client_id);
      const clientExists = await this.clientRepo.findOne({ where: { id: clientId } });
      if (!clientExists) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }
      existing.client = { id: clientId } as Client;
    }
    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  findAll() {
    return this.repo.find({ relations: ['client'] });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
  findByClientId(id: string){
    return this.repo.find({
      where: { client: { id: id } },
      relations: ['client'],
    });
  }
}