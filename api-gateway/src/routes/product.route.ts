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
    `/api/v1`,
    proxyService.createProxy(target!),
  );
}
