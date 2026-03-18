import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ClientsService } from 'src/services/clients.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { Client } from 'src/database/entities/client.entity';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';

@Controller('clients')
export class ClientsController {

    constructor(private readonly clientsService: ClientsService){}
    
    @Get('/')
    @UseGuards(JwtAuthGuard)
    getAllClients(){
        return this.clientsService.findAll()
    }

    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    getOneClient(@Param('id') id: string){
        return this.clientsService.findOne(id)
    }

    @Post('/')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiMessage('Client created successfully')
    @Roles(UserRole.ADMIN, UserRole.HR)
    createClient(@Body() data: Partial<Client>, @Req() req: { user?: { id: string | number } }){
        const userId = req.user?.id != null ? Number(req.user.id) : undefined;
        return this.clientsService.create(data, userId)
    }

    
    @Put('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.HR)
    @ApiMessage('Client updated successfully')
    updateClient(@Body() data: Partial<Client>, @Param('id') id: string, @Req() req: { user?: { id: string | number } }){
        const userId = req.user?.id != null ? Number(req.user.id) : undefined;
        return this.clientsService.update(data,id, userId)
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiMessage('Client deleted successfully')
    deleteClient(@Param('id') id: string, @Req() req: { user?: { id: string | number } }){
        const userId = req.user?.id != null ? Number(req.user.id) : undefined;
        return this.clientsService.remove(id, userId)
    }

}
