// Must load before any Nest code: Nest's DI reads decorator metadata through this polyfill.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { loadConfig } from './config';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule.forRoot(config));
  configureApp(app, config);
  // Lets SIGTERM (Docker, Kubernetes) drain the worker and close Redis connections cleanly.
  app.enableShutdownHooks();
  await app.listen(config.port);
}

bootstrap();
