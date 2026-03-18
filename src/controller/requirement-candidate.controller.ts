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
  BadRequestException,
} from '@nestjs/common';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequirementCandidateService } from 'src/services/requirement-candidate.service';
import type { RequirementCandidateCreateDto } from 'src/services/requirement-candidate.service';
import { EventReason } from 'src/database/entities/requirement-candidate-comment.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Requirement Candidate  Mapping created successfully')
  create(
    @Body() data: RequirementCandidateCreateDto,
    @Req() req: { user?: { id: string | number } },
  ) {
    const changedByUserId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.requirementCandidateService.create(data, changedByUserId);
  }

  /**
   * Record replacement by requirement (job) id and candidate id.
   * Use this when you have requirement_id and candidate_id; no need to know the internal application row id.
   * Body: { requirement_id, candidate_id, event_reason }
   */
  @Post('/reopen-requirement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Replacement recorded and requirement reopened successfully')
  recordReplacementByRequirementAndCandidate(
    @Body() body: {
      requirement_id: number;
      candidate_id: number;
      event_reason: EventReason;
    },
    @Req() req: { user?: { id: string | number } },
  ) {
    if (body?.requirement_id == null || body?.candidate_id == null) {
      throw new BadRequestException('requirement_id and candidate_id are required');
    }
    if (!body?.event_reason || !Object.values(EventReason).includes(body.event_reason)) {
      throw new BadRequestException(
        'event_reason is required and must be one of: RESIGNED, TERMINATED, ABSCONDED, CLIENT_REJECTED_AFTER_JOIN',
      );
    }
    const changedByUserId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.requirementCandidateService.recordReplacementByRequirementAndCandidate(
      body.requirement_id,
      body.candidate_id,
      body.event_reason,
      changedByUserId,
    );
  }

  /**
   * Record replacement by application row id (requirement_candidate.id).
   * Use when you already have the id of the candidate-application record.
   * Body: { event_reason, candidate_id? } (candidate_id optional, for validation)
   */
  @Post('/:id/record-replacement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Replacement recorded and requirement reopened successfully')
  recordReplacement(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { event_reason: EventReason; candidate_id?: number },
    @Req() req: { user?: { id: string | number } },
  ) {
    if (!body?.event_reason || !Object.values(EventReason).includes(body.event_reason)) {
      throw new BadRequestException(
        'event_reason is required and must be one of: RESIGNED, TERMINATED, ABSCONDED, CLIENT_REJECTED_AFTER_JOIN',
      );
    }
    const changedByUserId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.requirementCandidateService.recordReplacement(
      id,
      body.event_reason,
      body.candidate_id,
      changedByUserId,
    );
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Requirement Candidate  Mapping updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RequirementCandidateCreateDto>,
    @Req() req: { user?: { id: string | number } },
  ) {
    const changedByUserId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.requirementCandidateService.update(id, data, changedByUserId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiMessage('Requirement Candidate  Mapping deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: { id: string | number } }) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.requirementCandidateService.remove(id);
  }
}
