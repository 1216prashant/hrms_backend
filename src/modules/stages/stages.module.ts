import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CandidateStage } from "src/database/entities/candidate-stage.entity";
import { StagesService } from "src/services/stages.service";
import { StagesController } from "src/controller/stages.controller";

@Module({
    imports: [
      TypeOrmModule.forFeature([CandidateStage]),
      AuthModule,
    ],
    providers: [StagesService],
    controllers: [StagesController],
  })
  export class StagesModule {}