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
  import { ApiMessage } from 'src/common/decorators/api-message.decorator';
import { Candidate } from 'src/database/entities/candidate.entity';
import { CandidateStage } from 'src/database/entities/candidate-stage.entity';
import { StagesService } from 'src/services/stages.service';
  
  @Controller('stages')
  export class StagesController {
    constructor(private readonly stagesService: StagesService) {}
  
    @Get('/')
    @UseGuards(JwtAuthGuard)
    getAllStages() {
      return this.stagesService.findAll();
    }
  
    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    getOneStage(@Param('id', ParseIntPipe) id: number) {
      return this.stagesService.findOne(id);
    }
  
    @Post('/')
    @UseGuards(JwtAuthGuard)
    @ApiMessage('Candidate created successfully')
    createStage(@Body() data: Partial<CandidateStage>) {
      return this.stagesService.create(data);
    }
  
    @Put('/:id')
    @UseGuards(JwtAuthGuard)
    @ApiMessage('Candidate updated successfully')
    updateStage(
      @Body() data: Partial<Candidate>,
      @Param('id', ParseIntPipe) id: number,
    ) {
      return this.stagesService.update(id, data);
    }
  
    @Delete('/:id')
    @UseGuards(JwtAuthGuard)
    @ApiMessage('Candidate deleted successfully')
    deleteStage(@Param('id', ParseIntPipe) id: number) {
      return this.stagesService.remove(id);
    }
  }
  