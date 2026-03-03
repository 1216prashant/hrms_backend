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
import { ApiMessage } from 'src/common/decorators/api-message.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequirementStatusLogService } from 'src/services/requirement-status-log.service';
import type { RequirementStatusLogCreateDto } from 'src/services/requirement-status-log.service';

@Controller('requirement-status-logs')
export class RequirementStatusLogController {
  constructor(
    private readonly requirementStatusLogService: RequirementStatusLogService,
  ) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.requirementStatusLogService.findAll();
  }

  @Get('/requirement/:requirementId')
  @UseGuards(JwtAuthGuard)
  getByRequirement(@Param('requirementId', ParseIntPipe) requirementId: number) {
    return this.requirementStatusLogService.findByRequirementId(requirementId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.requirementStatusLogService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement status log created successfully')
  create(@Body() data: RequirementStatusLogCreateDto) {
    return this.requirementStatusLogService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement status log updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RequirementStatusLogCreateDto>,
  ) {
    return this.requirementStatusLogService.update(id, data);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement status log deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requirementStatusLogService.remove(id);
  }
}
