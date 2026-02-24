import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from 'src/controller/auth.controller';
import { User } from 'src/database/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => {
        // Use the same value in jwt.io "Verify Signature" to verify tokens. Min 32 chars for HS256.
        const secret =
          process.env.JWT_SECRET;
        return {
          secret,
          signOptions: {
            expiresIn: 60*30, // 30 minutes in seconds
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
