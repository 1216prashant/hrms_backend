import { Body, Controller, Post } from '@nestjs/common';
import { User } from 'src/database/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { LoginDto } from 'src/common/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: Partial<User>) {
    return this.authService.registerUser(data);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
