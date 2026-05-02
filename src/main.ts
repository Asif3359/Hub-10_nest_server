import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Hub-10 API')
    .setDescription('The Hub-10 API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const reflector = app.get(Reflector);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // writes openapi.json to the project root on every startup
  if (process.env.NODE_ENV !== 'production') {
    writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
