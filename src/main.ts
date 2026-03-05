import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadDir = process.env.UPLOAD_DEST || 'uploads';
  const uploadPath = join(process.cwd(), uploadDir);
  app.useStaticAssets(uploadPath, { prefix: '/upload/' });

  // CORS: allow frontend. If FRONTEND_URL is set (e.g. https://hrms.pragoinfotech.in), only that origin is allowed; otherwise allow any origin.
  const frontendUrls = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean)
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin or tools like Postman
      if (frontendUrls.length === 0) return callback(null, true); // allow any when FRONTEND_URL not set
      const allowed = frontendUrls.some((url) => origin === url || origin === url.replace(/\/$/, ''));
      callback(null, allowed ? origin : false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
