import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientFinanceDetail } from 'src/database/entities/client-finance-detail.entity';
import { Client } from 'src/database/entities/client.entity';
import { ClientFinanceDetailController } from 'src/controller/client-finance-detail.controller';
import { ClientFinanceDetailService } from 'src/services/client-finance-detail.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientFinanceDetail, Client]),
    AuthModule,
  ],
  providers: [ClientFinanceDetailService],
  controllers: [ClientFinanceDetailController],
})
export class ClientFinanceDetailsModule {}
