import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument } from './openapi';
import { DomainExceptionFilter } from './infrastructure/http/domain-exception.filter';

// Shared by main.ts and the e2e tests, so tests run the exact same pipeline as production
// (a test with a different setup could pass while the real app behaves differently).
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    // whitelist + forbidNonWhitelisted: unknown fields are a 400, not silently ignored.
    // transform: turns the plain JSON body into an instance of the DTO class.
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  // Swagger UI at /docs and the raw spec at /docs-json.
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app));
}
