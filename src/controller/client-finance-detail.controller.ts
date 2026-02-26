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
import { ClientFinanceDetailService } from 'src/services/client-finance-detail.service';
import { ClientFinanceDetail } from 'src/database/entities/client-finance-detail.entity';

@Controller('client-finance-details')
export class ClientFinanceDetailController {
  constructor(private readonly clientFinanceDetailService: ClientFinanceDetailService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.clientFinanceDetailService.findAll();
  }

  @Get('/client/:clientId')
  @UseGuards(JwtAuthGuard)
  getByClient(@Param('clientId') clientId: string) {
    return this.clientFinanceDetailService.findByClientId(clientId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientFinanceDetailService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() data: Partial<ClientFinanceDetail> & { client_id: number },
  ) {
    return this.clientFinanceDetailService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Body() data: Partial<ClientFinanceDetail> & { client_id?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientFinanceDetailService.update(data, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.clientFinanceDetailService.remove(id);
  }
}
