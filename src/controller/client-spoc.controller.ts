import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { ClientSpocService } from 'src/services/client-spoc.service';
import { ClientSpoc } from 'src/database/entities/client-spoc.entity';

@Controller('client-spocs')
export class ClientSpocController {

    constructor(private readonly clientSpocService: ClientSpocService){}
    
    @Get('/')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllClientSpoc(){
        return this.clientSpocService.findAll()
    }

    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    getOneClientSpoc(@Param('id') id: string){
        return this.clientSpocService.findOne(id)
    }
    
    @Get('/client/:id')
    @UseGuards(JwtAuthGuard)
    getOneClientSpocByClientId(@Param('id') id: string){
        return this.clientSpocService.findByClientId(id)
    }

    @Post('/')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Client SPOC created successfully')
    createClientSpoc(@Body() data: Partial<ClientSpoc>){
        return this.clientSpocService.create(data)
    }

    @Put('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Client SPOC updated successfully')
    updateClientSpoc(@Body() data: Partial<ClientSpoc>, @Param('id') id: string ){
        return this.clientSpocService.update(data,id)
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Client SPOC deleted successfully')
    deleteClientSpoc(@Param('id') id: string ){
        return this.clientSpocService.remove(id)
    }

}
