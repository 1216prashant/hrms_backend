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
import { RequirementCandidateCommentService } from 'src/services/requirement-candidate-comment.service';
import type { RequirementCandidateCommentCreateDto } from 'src/services/requirement-candidate-comment.service';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

@Controller('requirement-candidate-comments')
export class RequirementCandidateCommentController {
  constructor(
    private readonly requirementCandidateCommentService: RequirementCandidateCommentService,
  ) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.requirementCandidateCommentService.findAll();
  }

  @Get('/requirement-candidate/:requirementCandidateId')
  @UseGuards(JwtAuthGuard)
  getByRequirementCandidate(
    @Param('requirementCandidateId', ParseIntPipe) requirementCandidateId: number,
  ) {
    return this.requirementCandidateCommentService.findByRequirementCandidateId(
      requirementCandidateId,
    );
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.requirementCandidateCommentService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Comment created successfully')
  create(@Body() data: RequirementCandidateCommentCreateDto) {
    return this.requirementCandidateCommentService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Comment updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RequirementCandidateCommentCreateDto>,
  ) {
    return this.requirementCandidateCommentService.update(data, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiMessage('Comment deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.requirementCandidateCommentService.remove(id);
  }
}
