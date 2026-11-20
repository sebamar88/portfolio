// Must load before any Nest code: Nest's DI reads decorator metadata through this polyfill.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // Lets SIGTERM (Docker, Kubernetes) close connections cleanly instead of killing the process.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
