import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';

/**
 * ProxyService agora encaminha requisições via fetch
 * e aplica Circuit Breaker por serviço.
 */
@Injectable()
export class ProxyService {
  constructor(private readonly breakerService: CircuitBreakerService) {}

  /**
   * Cria um handler Express/Nest middleware com Circuit Breaker.
   *
   * @param serviceName nome lógico (ex: "products")
   * @param target URL do serviço (ex: http://products-service:3000)
   * @param upstreamBasePath path base que o serviço espera (ex: /products)
   */
  createBreakerProxy(serviceName: string, target: string, upstreamBasePath: string) {
    // "action" é a função que o breaker vai proteger
    const action = async (req: Request, res: Response) => {
      // req.url aqui já vem sem o prefixo montado no app.use()
      // Ex: se o cliente chamou /api/v1/products/123
      // e o app.use foi /api/v1/products, então req.url será /123
      const incomingPath = req.url === '/' ? '' : req.url;

      // Monta a URL final do upstream
      const url = `${target}${upstreamBasePath}${incomingPath}`;

      // Encaminha headers (tirando alguns que podem atrapalhar)
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (!v) continue;
        if (k.toLowerCase() === 'host') continue;
        headers[k] = Array.isArray(v) ? v.join(',') : String(v);
      }

      // Corpo: para aprendizado, vamos suportar JSON/texto (body parser do Nest)
      // Para GET/DELETE normalmente não tem body.
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined;

      const upstreamResponse = await fetch(url, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      });

      // Repasse do status
      res.status(upstreamResponse.status);

      // Repasse de headers (alguns são "sensíveis", mas para didática está ok)
      upstreamResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        res.setHeader(key, value);
      });

      // Corpo de resposta
      const contentType = upstreamResponse.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await upstreamResponse.json();
        return res.json(data);
      }

      const text = await upstreamResponse.text();
      return res.send(text);
    };

    // Cria (ou reaproveita) o breaker por serviço
    const breaker = this.breakerService.getBreaker(serviceName, action);

    // Retorna middleware que usa o breaker
    return async (req: Request, res: Response) => {
      try {
        // breaker.fire executa a "action" e contabiliza sucesso/falha/timeout
        await breaker.fire(req, res);
      } catch (err: any) {
        // Se o circuito estiver OPEN, a requisição é rejeitada rápido (reject)
        // Aqui devolvemos um fallback padrão
        const message = err?.code === 'EOPENBREAKER'
          ? 'Service temporarily unavailable (circuit open)'
          : 'Service request failed';

        res.status(503).json({
          error: message,
          service: serviceName,
        });
      }
    };
  }
}
