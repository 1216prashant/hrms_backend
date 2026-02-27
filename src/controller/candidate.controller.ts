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
import { CandidateService } from 'src/services/candidate.service';
import { Candidate } from 'src/database/entities/candidate.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getAllCandidates() {
    return this.candidateService.findAll();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getOneCandidate(@Param('id', ParseIntPipe) id: number) {
    return this.candidateService.findOne(id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Candidate created successfully')
  createCandidate(@Body() data: Partial<Candidate>) {
    return this.candidateService.create(data);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Candidate updated successfully')
  updateCandidate(
    @Body() data: Partial<Candidate>,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateService.update(id, data);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Candidate deleted successfully')
  deleteCandidate(@Param('id', ParseIntPipe) id: number) {
    return this.candidateService.remove(id);
  }
}
