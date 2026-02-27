import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/database/entities/invoice.entity';
import { Requirement } from 'src/database/entities/requirement.entity';
import { Candidate } from 'src/database/entities/candidate.entity';
import { InvoiceController } from 'src/controller/invoice.controller';
import { InvoiceService } from 'src/services/invoice.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Requirement, Candidate]),
    AuthModule,
  ],
  providers: [InvoiceService],
  controllers: [InvoiceController],
})
export class InvoicesModule {}
