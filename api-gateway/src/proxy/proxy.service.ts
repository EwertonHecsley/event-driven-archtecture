import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';

@Injectable()
export class ProxyService {
  constructor(private readonly breakerService: CircuitBreakerService) {}

  /**
   * Cria um "proxy handler" que encaminha a request para um serviço,
   * mas protegido por Circuit Breaker.
   *
   * @param serviceName nome lógico do serviço (ex: "products")
   * @param target URL do serviço (ex: "http://products-service:3000")
   * @param upstreamBasePath path base que o serviço espera (ex: "/products")
   */
  createBreakerProxy(serviceName: string, target: string, upstreamBasePath: string) {
    /**
     * ACTION: é a função que o circuit breaker protege.
     *
     * O breaker envolve essa função para:
     * - contar falhas/sucessos
     * - aplicar timeout
     * - abrir/fechar circuito
     */
    const action = async (req: Request, res: Response) => {
      /**
       * IMPORTANTE (conceito Express/Nest middleware):
       * Se você montou o middleware com:
       *   app.use('/api/v1/products', handler)
       * então aqui dentro `req.url` já vem sem esse prefixo.
       *
       * Exemplos:
       * - Cliente chamou: /api/v1/products
       *   req.url aqui vira: /
       *
       * - Cliente chamou: /api/v1/products/123
       *   req.url aqui vira: /123
       */
      const incomingPath = req.url === '/' ? '' : req.url;

      /**
       * Normaliza o upstreamBasePath pra garantir que começa com "/".
       * Ex: "products" -> "/products"
       */
      const base =
        upstreamBasePath && upstreamBasePath.startsWith('/')
          ? upstreamBasePath
          : `/${upstreamBasePath}`;

      /**
       * Monta a URL final do upstream (serviço interno).
       *
       * Ex:
       * target = http://products-service:3000
       * base   = /products
       * path   = /123
       *
       * final -> http://products-service:3000/products/123
       */
      const url = `${target}${base}${incomingPath}`;

      /**
       * Copia headers da request original para o upstream.
       * A gente remove o "host" porque ele é do gateway, não do serviço.
       */
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (!v) continue;
        if (k.toLowerCase() === 'host') continue;

        // Se o header vier como array, juntamos em string
        headers[k] = Array.isArray(v) ? v.join(',') : String(v);
      }

      /**
       * Body:
       * - GET/HEAD normalmente não têm body
       * - Para POST/PATCH/PUT, vamos enviar JSON (didático)
       *
       * OBS: Para upload/multipart/stream, a abordagem muda.
       */
      const hasBody =
        req.method !== 'GET' &&
        req.method !== 'HEAD' &&
        req.body !== undefined &&
        req.body !== null;

      // Se tem body e não tem content-type, assumimos JSON
      if (hasBody && !headers['content-type']) {
        headers['content-type'] = 'application/json';
      }

      /**
       * Faz a chamada HTTP para o serviço.
       * Quem controla timeout é o Circuit Breaker (opossum), via options.timeout.
       */
      const upstreamResponse = await fetch(url, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      });

      /**
       * 🔥 PONTO-CHAVE DO CIRCUIT BREAKER:
       * Se o serviço respondeu HTTP 5xx, isso significa falha do servidor
       * (ou dependência quebrada, como DB fora).
       *
       * Então nós consideramos isso "falha" pro breaker.
       *
       * Por quê?
       * Porque se ficar retornando 500 repetidamente,
       * faz sentido abrir o circuito e parar de martelar o serviço.
       */
      if (upstreamResponse.status >= 500) {
        // Lemos uma parte do body para ajudar no debug (sem explodir memória)
        const text = await upstreamResponse.text().catch(() => '');
        throw new Error(
          `Upstream ${serviceName} returned ${upstreamResponse.status}: ${text.slice(0, 200)}`,
        );
      }

      /**
       * Se não foi 5xx, consideramos sucesso do ponto de vista do breaker.
       * Agora só precisamos repassar status + response do upstream para o cliente.
       */
      res.status(upstreamResponse.status);

      /**
       * Repasse de headers do upstream pro client.
       * (Alguns headers tipo transfer-encoding podem causar problemas, então ignoramos.)
       */
      upstreamResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        res.setHeader(key, value);
      });

      /**
       * Corpo:
       * Se for JSON, fazemos res.json.
       * Caso contrário, devolvemos texto bruto.
       */
      const contentType = upstreamResponse.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const data = await upstreamResponse.json();
        return res.json(data);
      }

      const text = await upstreamResponse.text();
      return res.send(text);
    };

    /**
     * Pega (ou cria) o breaker do serviço.
     *
     * IMPORTANTE: precisamos reaproveitar o mesmo breaker,
     * senão ele nunca acumula histórico e nunca abre/fecha corretamente.
     */
    const breaker = this.breakerService.getBreaker(serviceName, action);

    /**
     * Esse é o handler final que o Nest/Express vai chamar em cada request.
     */
    return async (req: Request, res: Response) => {
      try {
        /**
         * breaker.fire(...) executa a action protegida.
         *
         * Ele pode:
         * - executar normalmente (CLOSED)
         * - rejeitar rápido (OPEN) -> erro com code EOPENBREAKER
         * - falhar por timeout (timeout)
         * - falhar por exception (failure)
         */
        await breaker.fire(req, res);
      } catch (err: any) {
        /**
         * Se o circuito estiver OPEN, o opossum rejeita a request
         * rapidamente com code: EOPENBREAKER.
         */
        const isOpenCircuit = err?.code === 'EOPENBREAKER';

        /**
         * Status code:
         * - 503 (Service Unavailable) quando o circuito está OPEN
         * - 502 (Bad Gateway) quando o gateway falhou ao falar com o upstream
         */
        res.status(isOpenCircuit ? 503 : 502).json({
          error: isOpenCircuit
            ? 'Service temporarily unavailable (circuit open)'
            : 'Bad gateway (upstream failure)',
          service: serviceName,
        });
      }
    };
  }
}