import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/strategies/jwt.strategy';
import { UserRole } from 'src/database/entities/user.entity';
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

  @Get('/hr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  getDashboardForHr(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const hrId = Number(user.id);
    return this.dashboardService.getDashboardForHr(query.from, query.to, hrId);
  }
}
