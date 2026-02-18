import { Injectable } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  createProxy(target: string, pathPrefix: string) {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${pathPrefix}`]: '',
      },
    });
  }
}
