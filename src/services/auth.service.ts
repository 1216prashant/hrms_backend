import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async registerUser(data: Partial<User>) {
    const { id, password, ...rest } = data;
    const hashedPassword = password
      ? await bcrypt.hash(password, this.SALT_ROUNDS)
      : undefined;
    const user = this.repo.create({
      ...rest,
      ...(hashedPassword !== undefined && { password: hashedPassword }),
    });
    const saved = await this.repo.save(user);
    const { password: _p, ...userWithoutPassword } = saved;
    return userWithoutPassword as User;
  }

  async login(email: string, password: string) {
    const user = await this.repo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      email: user.email,
      role: user.role,
      name: user.name,
      id: user.id,
      access_token: this.jwtService.sign(payload),
    };
  }
}
