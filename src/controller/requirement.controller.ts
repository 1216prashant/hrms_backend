import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { RequirementService } from 'src/services/requirement.service';
import { Requirement } from 'src/database/entities/requirement.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';
    
@Controller('requirements')
export class RequirementController {

    constructor(private readonly requirementService: RequirementService){}
    
    @Get('/')
    @UseGuards(JwtAuthGuard)
    getAllRequirements(){
        return this.requirementService.findAll()
    }

    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    getOneRequirement(@Param('id', ParseIntPipe) id: number){
        return this.requirementService.findOne(id)
    }

    @Get('/client/:id')
    @UseGuards(JwtAuthGuard)
    getOneClientSpocByClientId(@Param('id') id: string){
        return this.requirementService.findByClientId(id)
    }

    @Post('/')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Requirement created successfully')
    createRequirement(@Body() data: Partial<Requirement>){
        return this.requirementService.create(data)
    }

    
    @Put('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Requirement updated successfully')
    updateRequirement(@Body() data: Partial<Requirement>, @Param('id', ParseIntPipe) id: number ){
        return this.requirementService.update(data,id)
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Requirement deleted successfully')
    deleteRequirement(@Param('id', ParseIntPipe) id: number ){
        return this.requirementService.remove(id)
    }

}
