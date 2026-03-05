import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementStatusLog } from 'src/database/entities/requirement-status-log.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { User } from 'src/database/entities/user.entity';
import { RequirementStatusLogController } from 'src/controller/requirement-status-log.controller';
import { RequirementStatusLogService } from 'src/services/requirement-status-log.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequirementStatusLog, Requirement, User]),
    AuthModule,
  ],
  providers: [RequirementStatusLogService],
  controllers: [RequirementStatusLogController],
  exports: [RequirementStatusLogService],
})
export class RequirementStatusLogsModule {}
