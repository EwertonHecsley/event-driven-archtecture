import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProxyService } from './proxy/proxy.service';
import { ConfigService } from '@nestjs/config';
import { registerProductRoutes } from './routes/product.route';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const proxyService = app.get(ProxyService);
  const configService = app.get(ConfigService);

  registerProductRoutes(app,proxyService,configService);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
