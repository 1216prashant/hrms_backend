import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { User, UserRole } from 'src/database/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { LoginDto } from 'src/common/dto/login.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users/hr')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  getHrUsers() {
    return this.authService.findAllHrUsers();
  }


  @Post('register')
  register(@Body() data: Partial<User>) {
    return this.authService.registerUser(data);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  
}
