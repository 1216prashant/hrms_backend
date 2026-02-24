import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { Client } from "src/database/entities/client.entity";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ClientSpocService } from "src/services/client-spoc.service";
import { ClientSpocController } from "src/controller/client-spoc.controller";

@Module({
    imports: [
      TypeOrmModule.forFeature([ClientSpoc, Client]),
      AuthModule,
    ],
    providers: [ClientSpocService],
    controllers: [ClientSpocController],    
  })
  export class ClientSpocModule {}