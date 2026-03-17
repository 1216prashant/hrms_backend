import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  getHello(): string {
    return 'Backend Service is working';
  }

  @Get('health')
  getHealth(): string {
    return 'Backend Service is healthy';
  }
}
