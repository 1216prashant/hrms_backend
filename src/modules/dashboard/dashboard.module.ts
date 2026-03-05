import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from 'src/database/entities/requirement.entity';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { Invoice } from 'src/database/entities/invoice.entity';
import { Payment } from 'src/database/entities/payment.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';
import { User } from 'src/database/entities/user.entity';
import { Client } from 'src/database/entities/client.entity';
import { DashboardController } from 'src/controller/dashboard.controller';
import { DashboardService } from 'src/services/dashboard.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requirement,
      RequirementCandidate,
      Invoice,
      Payment,
      CandidateStage,
      User,
      Client,
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
