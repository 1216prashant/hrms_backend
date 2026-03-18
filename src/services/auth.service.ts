import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly RESET_TOKEN_BYTES = 32;
  private readonly RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
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

  async findAllHrUsers() {
    return this.repo.find({ where: { role: UserRole.HR } });
  }

  async findOneById(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const { password: _p, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private sha256Hex(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async forgotPassword(email: string) {
    // Always respond with success to avoid email enumeration.
    const user = await this.repo.findOne({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link was sent.' };

    const token = randomBytes(this.RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = this.sha256Hex(token);
    const expiresAt = new Date(Date.now() + this.RESET_TOKEN_TTL_MS);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;
    await this.repo.save(user);

    const frontendUrl = process.env.FRONTEND_URL;
    const link = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailService.sendPasswordResetEmail(user.email, link);

    return { message: 'If the email exists, a reset link was sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.sha256Hex(token);
    const user = await this.repo.findOne({ where: { passwordResetTokenHash: tokenHash } });

    if (!user || !user.passwordResetTokenExpiresAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await this.repo.save(user);

    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.repo.save(user);

    return { message: 'Password changed successfully' };
  }
}
