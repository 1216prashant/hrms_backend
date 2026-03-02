import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementCandidateComment } from 'src/database/entities/requirement-candidate-comment.entity';
import { RequirementCandidate } from 'src/database/entities/requirement-candidate.entity';
import { User } from 'src/database/entities/user.entity';
import { RequirementCandidateCommentService } from 'src/services/requirement-candidate-comment.service';
import { RequirementCandidateCommentController } from 'src/controller/requirement-candidate-comment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequirementCandidateComment,
      RequirementCandidate,
      User,
    ]),
    AuthModule,
  ],
  providers: [RequirementCandidateCommentService],
  controllers: [RequirementCandidateCommentController],
})
export class RequirementCandidateCommentsModule {}
