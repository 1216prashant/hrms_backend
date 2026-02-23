import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClientsService } from 'src/services/clients.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('clients')
export class ClientsController {

    constructor(private readonly clientsService: ClientsService){}
    
    @Get('/')
    @UseGuards(JwtAuthGuard)
    getClients(){
        //return this.clientsService.findAll()
        return "Client API working"
    }
}
