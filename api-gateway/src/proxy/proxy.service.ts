import { Injectable } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  
  createProxy(target: string, upstreamBasePath = '') {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      timeout: 5000,

      pathRewrite: (path) => {
        const normalizedBase =
          upstreamBasePath && upstreamBasePath.startsWith('/')
            ? upstreamBasePath
            : upstreamBasePath
              ? `/${upstreamBasePath}`
              : '';

        if (path === '/') return normalizedBase || '/';

        return `${normalizedBase}${path}`;
      },
    });
  }
}
