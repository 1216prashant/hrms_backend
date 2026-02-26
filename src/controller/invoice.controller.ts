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
import { InvoiceService } from 'src/services/invoice.service';
import { Invoice } from 'src/database/entities/invoice.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAllInvoices() {
    return this.invoiceService.findAll();
  }

  @Get('/requirement/:requirementId')
  @UseGuards(JwtAuthGuard)
  getByRequirement(@Param('requirementId', ParseIntPipe) requirementId: number) {
    return this.invoiceService.findByRequirementId(requirementId);
  }

  @Get('/candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  getByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return this.invoiceService.findByCandidateId(candidateId);
  }

  @Get('/client/:clientId')
  @UseGuards(JwtAuthGuard)
  getByClient(@Param('clientId') clientId: string) {
    return this.invoiceService.findByClientId(clientId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOneInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Invoice created successfully')
  createInvoice(@Body() data: Partial<Invoice> & { requirement_id: number; candidate_id: number }) {
    return this.invoiceService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Invoice updated successfully')
  updateInvoice(
    @Body() data: Partial<Invoice> & { requirement_id?: number; candidate_id?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.invoiceService.update(data, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Invoice deleted successfully')
  deleteInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.remove(id);
  }
}
