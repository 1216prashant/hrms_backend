import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/database/entities/payment.entity';
import { Invoice } from 'src/database/entities/invoice.entity';
import { PaymentController } from 'src/controller/payment.controller';
import { PaymentService } from 'src/services/payment.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice]),
    AuthModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentsModule {}
