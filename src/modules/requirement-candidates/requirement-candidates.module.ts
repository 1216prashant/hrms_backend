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

@Module({
  imports: [
    TypeOrmModule.forFeature([RequirementCandidate, Requirement, Candidate, CandidateStage]),
    AuthModule,
    InvoicesModule,
  ],
  providers: [RequirementCandidateService],
  controllers: [RequirementCandidateController],
})
export class RequirementCandidatesModule {}
