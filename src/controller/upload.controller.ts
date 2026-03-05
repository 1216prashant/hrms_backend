import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiMessage } from 'src/common/decorators/api-message.decorator';
import { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FileTransferService } from 'src/services/file-transfer.service';

const UPLOAD_DEST = process.env.UPLOAD_DEST || '/home/u565561609/domains/hrms.pragoinfotech.in/public_html/uploads';
const UPLOAD_DIR = path.isAbsolute(UPLOAD_DEST) ? UPLOAD_DEST : path.join(process.cwd(), UPLOAD_DEST);

const SUBDIRS = {
  resume: '',
  agreement: 'agreements',
  requirement: 'requirements',
} as const;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function multerOptions(subdir: keyof typeof SUBDIRS) {
  const dir = subdir ? path.join(UPLOAD_DIR, SUBDIRS[subdir]) : UPLOAD_DIR;
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        ensureDir(UPLOAD_DIR);
        if (subdir) ensureDir(dir);
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const safeName = (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  };
}

function fileResponse(
  file: Express.Multer.File,
  urlPrefix: string,
): { filename: string; originalName: string; mimetype: string; size: number; path: string; url: string } {
  const relativePath = file.path ? path.relative(process.cwd(), file.path) : urlPrefix + '/' + file.filename;
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: relativePath.replace(/\\/g, '/'),
    url: `${urlPrefix}/${file.filename}`,
  };
}

@Controller('upload')
export class UploadController {
  constructor(private readonly fileTransferService: FileTransferService) {}

  /** Resume uploads – form field: "file" */
  @Post('resume')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Resume uploaded successfully')
  @UseInterceptors(FileInterceptor('file', multerOptions('resume')))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided. Use form field name "file".');
    const response = fileResponse(file, '/upload');
    const remoteUrl = await this.fileTransferService.uploadFileAndGetUrl(file.path, SUBDIRS.resume);
    return { ...response, url: remoteUrl };
  }

  /** Client agreement file uploads – form field: "file" */
  @Post('agreement')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Client agreement file uploaded successfully')
  @UseInterceptors(FileInterceptor('file', multerOptions('agreement')))
  async uploadAgreement(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided. Use form field name "file".');
    const response = fileResponse(file, '/upload/agreements');
    const remoteUrl = await this.fileTransferService.uploadFileAndGetUrl(file.path, SUBDIRS.agreement);
    return { ...response, url: remoteUrl };
  }

  /** Requirement file uploads – form field: "file" */
  @Post('requirement')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Requirement file uploaded successfully')
  @UseInterceptors(FileInterceptor('file', multerOptions('requirement')))
  async uploadRequirement(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided. Use form field name "file".');
    const response = fileResponse(file, '/upload/requirements');
    const remoteUrl = await this.fileTransferService.uploadFileAndGetUrl(file.path, SUBDIRS.requirement);
    return { ...response, url: remoteUrl };
  }
}
