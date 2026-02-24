import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from 'src/database/entities/candidate.entity';
import { CandidateController } from 'src/controller/candidate.controller';
import { CandidateService } from 'src/services/candidate.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate]),
    AuthModule,
  ],
  providers: [CandidateService],
  controllers: [CandidateController],
})
export class CandidatesModule {}
