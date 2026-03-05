import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';
import { RequirementCandidateController } from 'src/controller/requirement-candidate.controller';
import { RequirementCandidateService } from 'src/services/requirement-candidate.service';
import { AuthModule } from '../auth/auth.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { RequirementCandidateCommentsModule } from '../requirement-candidate-comments/requirement-candidate-comments.module';
import { RequirementModule } from '../requirements/requirements.module';
import { RequirementStatusLogsModule } from '../requirement-status-logs/requirement-status-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequirementCandidate, Requirement, Candidate, CandidateStage]),
    AuthModule,
    InvoicesModule,
    RequirementCandidateCommentsModule,
    RequirementModule,
    RequirementStatusLogsModule,
  ],
  providers: [RequirementCandidateService],
  controllers: [RequirementCandidateController],
})
export class RequirementCandidatesModule {}
