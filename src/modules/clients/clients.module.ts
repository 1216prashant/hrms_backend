import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsService } from "../../services/clients.service";
import { ClientsController } from "../../controller/clients.controller";
import { Client } from "src/database/entities/client.entity";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [
      TypeOrmModule.forFeature([Client]),
      AuthModule,
    ],
    providers: [ClientsService],
    controllers: [ClientsController],
  })
  export class ClientsModule {}