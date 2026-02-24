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
import { RequirementCandidateService } from 'src/services/requirement-candidate.service';
import type { RequirementCandidateCreateDto } from 'src/services/requirement-candidate.service';

@Controller('requirement-candidates')
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

  @Get('/requirement/:requirementId')
  @UseGuards(JwtAuthGuard)
  getByRequirement(@Param('requirementId', ParseIntPipe) requirementId: number) {
    return this.requirementCandidateService.findByRequirementId(requirementId);
  }

  @Get('/candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  getByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return this.requirementCandidateService.findByCandidateId(candidateId);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  create(@Body() data: RequirementCandidateCreateDto) {
    return this.requirementCandidateService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RequirementCandidateCreateDto>,
  ) {
    return this.requirementCandidateService.update(id, data);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requirementCandidateService.remove(id);
  }
}
