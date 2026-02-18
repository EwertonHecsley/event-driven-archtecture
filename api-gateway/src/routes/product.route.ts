import { INestApplication } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';

export function registerProductRoutes(
  app: INestApplication,
  proxyService: ProxyService,
  configService: ConfigService,
) {
  const target = configService.get<string>('services.products');

  app.use(
    '/products',
    proxyService.createProxy(target!, '/products'),
  );
}
