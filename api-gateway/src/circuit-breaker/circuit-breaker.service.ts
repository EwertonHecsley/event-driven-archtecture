import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { defaultBreakerOptions } from './breaker.options';

type BreakerSnapshot = {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  stats?: Record<string, any>;
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  // ✅ Aqui guardamos 1 breaker por serviço (products, orders, etc)
  private readonly breakers = new Map<string, CircuitBreaker<any, any>>();

  getBreaker<TArgs, TResult>(
    serviceName: string,
    action: (...args: TArgs[]) => Promise<TResult>,
  ): CircuitBreaker<any, any> {
    const existing = this.breakers.get(serviceName);
    if (existing) return existing;

    const breaker = new CircuitBreaker(action, defaultBreakerOptions);

    // Eventos importantes para entender o comportamento do breaker
    breaker.on('open', () => this.logger.warn(`Circuit OPEN para ${serviceName}`));
    breaker.on('halfOpen', () => this.logger.warn(`Circuit HALF_OPEN para ${serviceName}`));
    breaker.on('close', () => this.logger.log(`Circuit CLOSED para ${serviceName}`));
    breaker.on('reject', () => this.logger.warn(`Request REJEITADA (OPEN) para ${serviceName}`));
    breaker.on('timeout', () => this.logger.warn(`Timeout ao chamar ${serviceName}`));
    breaker.on('failure', (err) =>
      this.logger.warn(`Failure em ${serviceName}: ${err?.message ?? err}`),
    );

    // ✅ Guardamos no map para manter estado histórico
    this.breakers.set(serviceName, breaker);

    return breaker;
  }

  /**
   * Retorna um snapshot de todos breakers (estado + stats),
   * para expor via endpoint interno.
   */
  getAllSnapshots(): Record<string, BreakerSnapshot> {
    const out: Record<string, BreakerSnapshot> = {};

    for (const [name, breaker] of this.breakers.entries()) {
      out[name] = {
        name,
        state: this.getState(breaker),
        stats: this.getStats(breaker),
      };
    }

    return out;
  }

  /**
   * Descobre o estado atual do breaker.
   * Esses booleans são fornecidos pelo opossum.
   */
  private getState(breaker: CircuitBreaker<any, any>): BreakerSnapshot['state'] {
    const b: any = breaker;

    if (b.halfOpen) return 'HALF_OPEN';
    if (b.opened) return 'OPEN';
    return 'CLOSED';
  }

  /**
   * Extrai métricas do breaker.
   * O opossum tem variações por versão, então fazemos fallback defensivo.
   */
  private getStats(breaker: CircuitBreaker<any, any>): Record<string, any> | undefined {
    const b: any = breaker;

    // Algumas versões usam breaker.stats
    if (b.stats) return b.stats;

    // Outras expõem breaker.status.stats
    if (b.status?.stats) return b.status.stats;

    // Se não existir, devolve undefined
    return undefined;
  }
}