import { TypeOrmModule } from "@nestjs/typeorm";
import { Client } from "src/database/entities/client.entity";
import { ClientSpoc } from "src/database/entities/client-spoc.entity";
import { User } from "src/database/entities/user.entity";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { Requirement } from "src/database/entities/requirement.entity";
import { RequirementController } from "src/controller/requirement.controller";
import { RequirementService } from "src/services/requirement.service";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
    imports: [
      TypeOrmModule.forFeature([Requirement, Client, ClientSpoc, User]),
      AuthModule,
      InvoicesModule,
    ],
    providers: [RequirementService],
    controllers: [RequirementController],
  })
  export class RequirementModule {}