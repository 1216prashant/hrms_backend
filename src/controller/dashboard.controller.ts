import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DashboardService } from 'src/services/dashboard.service';
import { DashboardQueryDto } from 'src/modules/dashboard/dto/dashboard-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  getDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getDashboard(query.from, query.to);
  }
}
