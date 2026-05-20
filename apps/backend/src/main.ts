import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";

/**
 * Bootstraps the NestJS application.
 * Configures global pipes (validation with whitelist/transform), CORS for the frontend
 * origin, and static asset serving for uploaded files. Listens on PORT (default 3001).
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded images from /uploads path
  app.useStaticAssets(join(__dirname, "../uploads"), {
    prefix: "/uploads",
  });

  // Enable CORS for frontend communication
  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  });

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
