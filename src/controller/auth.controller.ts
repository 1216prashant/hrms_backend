import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { User, UserRole } from 'src/database/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { LoginDto } from 'src/common/dto/login.dto';
import { ForgotPasswordDto } from 'src/common/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/common/dto/reset-password.dto';
import { ChangePasswordDto } from 'src/common/dto/change-password.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayload } from 'src/common/strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users/hr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  getHrUsers() {
    return this.authService.findAllHrUsers();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOneById(id);
  }

  @Post('register')
  register(@Body() data: Partial<User>) {
    return this.authService.registerUser(data);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      Number(user.id),
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
