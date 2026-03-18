import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { PaymentService } from 'src/services/payment.service';
import { Payment } from 'src/database/entities/payment.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

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
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Payment created successfully')
  createPayment(@Body() data: Partial<Payment> & { invoice_id: number }, @Req() req: { user?: { id: string | number } }) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.paymentService.create(data, userId);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Payment updated successfully')
  updatePayment(
    @Body() data: Partial<Payment> & { invoice_id?: number },
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user?: { id: string | number } }
  ) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.paymentService.update(data, id, userId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Payment deleted successfully')
  deletePayment(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: { id: string | number } }) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.paymentService.remove(id, userId);
  }
}
