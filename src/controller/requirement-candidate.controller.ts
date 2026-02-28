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
import { RequirementCandidateService } from 'src/services/requirement-candidate.service';
import type { RequirementCandidateCreateDto } from 'src/services/requirement-candidate.service';

@Controller('candidates-applications')
export class RequirementCandidateController {
  constructor(
    private readonly requirementCandidateService: RequirementCandidateService,
  ) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.requirementCandidateService.findAll();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.requirementCandidateService.findOne(id);
  }

  @Get('/application/:applicationId')
  @UseGuards(JwtAuthGuard)
  getByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.requirementCandidateService.findByApplicationId(applicationId);
  }

  @Get('/application/:applicationId/pipeline')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement pipeline fetched successfully')
  getRequirementPipeline(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.requirementCandidateService.getApplicationPipeline(applicationId);
  }

  @Get('/candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  getByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return this.requirementCandidateService.findByCandidateId(candidateId);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement Candidate  Mapping created successfully')
  create(@Body() data: RequirementCandidateCreateDto) {
    return this.requirementCandidateService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement Candidate  Mapping updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RequirementCandidateCreateDto>,
  ) {
    return this.requirementCandidateService.update(id, data);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement Candidate  Mapping deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requirementCandidateService.remove(id);
  }
}
