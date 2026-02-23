import { Injectable } from "@nestjs/common";
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