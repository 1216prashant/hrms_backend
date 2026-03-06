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
  createCandidate(
    @Body() data: Partial<Candidate>,
    @Req() req: { user?: { id: string | number } },
  ) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.candidateService.create(data, userId);
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Candidate updated successfully')
  updateCandidate(
    @Body() data: Partial<Candidate>,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user?: { id: string | number } },
  ) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.candidateService.update(id, data, userId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Candidate deleted successfully')
  deleteCandidate(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: { id: string | number } }) {
    const userId = req.user?.id != null ? Number(req.user.id) : undefined;
    return this.candidateService.remove(id, userId);
  }
}
