import { Module } from '@nestjs/common';
import { UploadController } from 'src/controller/upload.controller';
import { AuthModule } from '../auth/auth.module';
import { FileTransferService } from 'src/services/file-transfer.service';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [FileTransferService],
})
export class UploadModule {}
