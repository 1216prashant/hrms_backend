import { Module } from '@nestjs/common';
import { UploadController } from 'src/controller/upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
})
export class UploadModule {}
