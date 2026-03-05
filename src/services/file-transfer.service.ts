import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { Client } from 'basic-ftp';

@Injectable()
export class FileTransferService {
  private readonly logger = new Logger(FileTransferService.name);

  // Use explicit FTP_* env vars; SFTP_* from older config are ignored now to avoid confusion.
  private readonly host = process.env.FTP_HOST;
  /** FTP uses port 21. Do not use 22 (that is SSH/SFTP). */
  private readonly port = Number(process.env.FTP_PORT ?? 21);
  private readonly username = process.env.FTP_USERNAME;
  private readonly password = process.env.FTP_PASSWORD;
  private readonly remoteBaseDir = (process.env.FTP_REMOTE_BASE_DIR || '/domains/hrms.pragoinfotech.in/public_html/uploads').replace(
    /\\/g,
    '/',
  );
  private readonly baseUrl = (process.env.FTP_BASE_URL || 'https://hrms.pragoinfotech.in/uploads').replace(/\/$/, '');

  async uploadFileAndGetUrl(localPath: string, remoteSubdir = ''): Promise<string> {
    // Host sometimes gets configured with protocol prefix like "ftp://1.2.3.4"; strip it if present.
    const rawHost = this.host?.replace(/^ftp:\/\//i, '').trim();

    if (!rawHost || !this.username || !this.password) {
      this.logger.error('FTP connection details are not fully configured');
      throw new InternalServerErrorException('File transfer is not configured on the server');
    }

    const fileName = path.basename(localPath);
    const remoteDir = remoteSubdir ? `${this.remoteBaseDir}/${remoteSubdir}` : this.remoteBaseDir;
    const client = new Client();

    try {
      await client.access({
        host: rawHost,
        port: this.port,
        user: this.username,
        password: this.password,
        // If your Hostinger account requires FTPS, set FTP_SECURE=true in .env and we’ll send TLS.
        secure: process.env.FTP_SECURE === 'true' ? true : false,
      });

      await client.ensureDir(remoteDir);
      // ensureDir changes CWD to remoteDir, so just pass the filename here.
      await client.uploadFrom(localPath, fileName);

      return `${this.baseUrl}${remoteSubdir ? `/${remoteSubdir}` : ''}/${fileName}`;
    } catch (error) {
      this.logger.error(
        `Failed to upload file via FTP (host=${rawHost}, port=${this.port}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException('Failed to upload file to remote storage');
    } finally {
      try {
        client.close();
      } catch {
        // ignore
      }

      fs.unlink(localPath, (err) => {
        if (err) {
          this.logger.warn(`Failed to delete local temp file ${localPath}: ${err.message}`);
        }
      });
    }
  }
}
