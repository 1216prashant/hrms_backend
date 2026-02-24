import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { Client } from "src/database/entities/client.entity";
import { Requirement } from "src/database/entities/requirement.entity";
import { User } from "src/database/entities/user.entity";
import { Repository } from "typeorm";

type RequirementCreateDto = Partial<Requirement> & {
  client_id?: string | number;
  spoc_id?: string | number;
  assigned_hr_id?: string | number | null;
};

@Injectable()
export class RequirementService {

  constructor(
    @InjectRepository(Requirement)
    private repo: Repository<Requirement>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    @InjectRepository(ClientSpoc)
    private spocRepo: Repository<ClientSpoc>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(data: RequirementCreateDto) {
    const { client_id, spoc_id, assigned_hr_id, ...rest } = data;
    const clientId = client_id != null ? String(client_id) : undefined;
    const spocId = spoc_id != null ? String(spoc_id) : undefined;

    if (!clientId) {
      throw new BadRequestException('client_id is required');
    }
    if (!spocId) {
      throw new BadRequestException('spoc_id is required');
    }

    const [clientExists, spocExists] = await Promise.all([
      this.clientRepo.findOne({ where: { id: clientId } }),
      this.spocRepo.findOne({ where: { id: spocId } }),
    ]);
    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }
    if (!spocExists) {
      throw new NotFoundException(`Client SPOC with id ${spocId} not found`);
    }

    let assignedHr: { id: number } | null = null;
    if (assigned_hr_id != null && assigned_hr_id !== '') {
      const hrId = Number(assigned_hr_id);
      if (!Number.isInteger(hrId)) {
        throw new BadRequestException('assigned_hr_id must be a valid user id');
      }
      const hrExists = await this.userRepo.findOne({ where: { id: hrId } });
      if (!hrExists) {
        throw new NotFoundException(`User (assigned HR) with id ${hrId} not found`);
      }
      assignedHr = { id: hrId };
    }

    const requirement = this.repo.create({
      ...rest,
      client: { id: clientId },
      spoc: { id: spocId },
      ...(assignedHr && { assignedHr }),
    });
    const saved = await this.repo.save(requirement);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
  }

  async update(data: RequirementCreateDto, id: number) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
    if (!existing) {
      throw new NotFoundException(`Requirement with id ${id} not found`);
    }

    const { client_id, spoc_id, assigned_hr_id, ...rest } = data;

    if (client_id != null) {
      const clientId = String(client_id);
      const clientExists = await this.clientRepo.findOne({ where: { id: clientId } });
      if (!clientExists) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }
      existing.client = { id: clientId } as Client;
    }
    if (spoc_id != null) {
      const spocId = String(spoc_id);
      const spocExists = await this.spocRepo.findOne({ where: { id: spocId } });
      if (!spocExists) {
        throw new NotFoundException(`Client SPOC with id ${spocId} not found`);
      }
      existing.spoc = { id: spocId } as ClientSpoc;
    }
    if (assigned_hr_id !== undefined) {
      if (assigned_hr_id == null || assigned_hr_id === '') {
        existing.assignedHr = null;
      } else {
        const hrId = Number(assigned_hr_id);
        if (!Number.isInteger(hrId)) {
          throw new BadRequestException('assigned_hr_id must be a valid user id');
        }
        const hrExists = await this.userRepo.findOne({ where: { id: hrId } });
        if (!hrExists) {
          throw new NotFoundException(`User (assigned HR) with id ${hrId} not found`);
        }
        existing.assignedHr = { id: hrId } as User;
      }
    }

    Object.assign(existing, rest);
    await this.repo.save(existing);
    return this.repo.findOne({
      where: { id },
      relations: ['client', 'spoc', 'assignedHr'],
    });
  }

  findAll() {
    return this.repo.find({ relations: ['client','spoc','assignedHr'] });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['client','spoc','assignedHr'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
  findByClientId(id: string){
    return this.repo.find({
      where: { client: { id: id } },
      relations: ['client','spoc','assignedHr'],
    });
  }
}