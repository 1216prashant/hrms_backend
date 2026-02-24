import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { PaymentService } from 'src/services/payment.service';
import { Payment } from 'src/database/entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAllPayments() {
    return this.paymentService.findAll();
  }

  @Get('/invoice/:invoiceId')
  @UseGuards(JwtAuthGuard)
  getByInvoice(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
    return this.paymentService.findByInvoiceId(invoiceId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOnePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPayment(@Body() data: Partial<Payment> & { invoice_id: number }) {
    return this.paymentService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePayment(
    @Body() data: Partial<Payment> & { invoice_id?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentService.update(data, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deletePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.remove(id);
  }
}
