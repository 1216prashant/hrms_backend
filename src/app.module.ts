import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Client } from './database/entities/client.entity';
import { ClientSpoc } from './database/entities/client-spoc.entity';
import { Requirement } from './database/entities/requirement.entity';
import { User } from './database/entities/user.entity';
import { ClientsModule } from './modules/clients/clients.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { ClientSpocModule } from './modules/clients/client-spoc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql', // change to 'postgres' if needed
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // ⚠ only in development
    }),
    TypeOrmModule.forFeature([User, Requirement, Client, ClientSpoc]),
    ClientSpocModule,
    ClientsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
