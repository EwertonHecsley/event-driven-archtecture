import { INestApplication, Logger } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';

export function registerRoutes(
  app: INestApplication,
  proxyService: ProxyService,
  configService: ConfigService,
) {
  const API_PREFIX = '/api/v1';
  const services = configService.get<Record<string, string>>('services') ?? {};

  Object.entries(services).forEach(([serviceName, target]) => {
    if (!target) return;

    const upstreamBasePath = `/${serviceName}`;

    const externalPath = `${API_PREFIX}/${serviceName}`;

    app.use(
      externalPath,
      proxyService.createBreakerProxy(serviceName, target, upstreamBasePath),
    );

    Logger.log(
      `✅ Proxy registrado: ${API_PREFIX}/${serviceName} → ${target}${upstreamBasePath}`,
      'registerRoutes',
    );
  });
}
