import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientAgreement } from 'src/database/entities/client-agreement.entity';
import { Client } from 'src/database/entities/client.entity';
import { ClientAgreementController } from 'src/controller/client-agreement.controller';
import { ClientAgreementService } from 'src/services/client-agreement.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientAgreement, Client]),
    AuthModule,
  ],
  providers: [ClientAgreementService],
  controllers: [ClientAgreementController],
})
export class ClientAgreementsModule {}
