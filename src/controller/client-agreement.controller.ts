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
import { ClientAgreementService } from 'src/services/client-agreement.service';
import { ClientAgreement } from 'src/database/entities/client-agreement.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

@Controller('client-agreements')
export class ClientAgreementController {
  constructor(private readonly clientAgreementService: ClientAgreementService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.clientAgreementService.findAll();
  }

  @Get('/client/:clientId')
  @UseGuards(JwtAuthGuard)
  getByClient(@Param('clientId') clientId: string) {
    return this.clientAgreementService.findByClientId(clientId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientAgreementService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiMessage('Client Agreement created successfully')
  @Roles(UserRole.ADMIN)
  create(
    @Body() data: Partial<ClientAgreement> & { client_id: number },
  ) {
    return this.clientAgreementService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Client Agreement updated successfully')
  update(
    @Body() data: Partial<ClientAgreement> & { client_id?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientAgreementService.update(data, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Client Agreement deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.clientAgreementService.remove(id);
  }
}
