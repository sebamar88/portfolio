import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

// One place builds the document, so the served /docs-json and the committed contract
// (scripts/generate-contract.ts) can never describe different APIs.
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder().setTitle('Shared Expenses API').setVersion('0.1.0').build();
  return SwaggerModule.createDocument(app, config);
}
