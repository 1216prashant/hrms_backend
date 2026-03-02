import { Module } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Client } from './database/entities/client.entity';
import { ClientSpoc } from './database/entities/client-spoc.entity';
import { Requirement } from './database/entities/requirement.entity';
import { User } from './database/entities/user.entity';
import { ClientsModule } from './modules/clients/clients.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { ClientSpocModule } from './modules/clients/client-spoc.module';
import { RequirementModule } from './modules/requirements/requirements.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { RequirementCandidatesModule } from './modules/requirement-candidates/requirement-candidates.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ClientAgreementsModule } from './modules/client-agreements/client-agreements.module';
import { ClientFinanceDetailsModule } from './modules/client-finance-details/client-finance-details.module';
import { UploadModule } from './modules/upload/upload.module';
import { StagesModule } from './modules/stages/stages.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RequirementCandidateCommentsModule } from './modules/requirement-candidate-comments/requirement-candidate-comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql', // change to 'postgres' if needed
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // ⚠ only in development
    }),
    TypeOrmModule.forFeature([User, Requirement, Client, ClientSpoc]),
    ClientSpocModule,
    ClientsModule,
    RequirementModule,
    CandidatesModule,
    RequirementCandidatesModule,
    InvoicesModule,
    PaymentsModule,
    ClientAgreementsModule,
    ClientFinanceDetailsModule,
    UploadModule,
    AuthModule,
    StagesModule,
    DashboardModule,
    RequirementCandidateCommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
