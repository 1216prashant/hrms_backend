import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Client } from "src/database/entities/client.entity";
import { User } from "src/database/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class ClientsService {

  constructor(
    @InjectRepository(Client)
    private repo: Repository<Client>,
  ) {}

  create(data: Partial<Client>, userId?: number) {
    const client = this.repo.create({
      ...data,
      ...(userId != null && {
        createdByUser: { id: userId } as User,
        updatedByUser: { id: userId } as User,
      }),
    });
    return this.repo.save(client);
  }

  async update(data: Partial<Client>, id: string | number, userId?: number) {
    const clientId = Number(id);
    const existing = await this.repo.findOne({ where: { id: clientId, isDeleted: false } });
    if (!existing) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    Object.assign(existing, data);
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    return this.repo.save(existing);
  }

  findAll() {
    return this.repo.find({ where: { isDeleted: false }, relations: ['spocs', 'requirements', 'createdByUser', 'updatedByUser'] });
  }

  findOne(id: string | number) {
    const clientId = Number(id);
    return this.repo.findOne({
      where: { id: clientId, isDeleted: false },
      relations: ['spocs', 'requirements', 'createdByUser', 'updatedByUser'],
    });
  }

  async remove(id: string | number, userId?: number) {
    const existing = await this.repo.findOne({ where: { id: Number(id), isDeleted: false } });
    if (!existing) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    if (userId != null) {
      existing.updatedByUser = { id: userId } as User;
    }
    existing.isDeleted = true;
    return this.repo.save(existing);
  }
}