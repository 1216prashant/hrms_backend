import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Client } from "src/database/entities/client.entity";
import { Repository } from "typeorm";

@Injectable()
export class ClientsService {

  constructor(
    @InjectRepository(Client)
    private repo: Repository<Client>,
  ) {}

  create(data: Partial<Client>) {
    const client = this.repo.create(data);
    return this.repo.save(client);
  }

  async update(data: Partial<Client>, id: string) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return this.repo.findOne({
      where: { id },
      relations: ['spocs', 'requirements'],
    });
  }

  findAll() {
    return this.repo.find({ relations: ['spocs', 'requirements'] });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['spocs', 'requirements'],
    });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}