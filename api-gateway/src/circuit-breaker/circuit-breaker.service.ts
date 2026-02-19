import { Injectable, Logger } from "@nestjs/common";
import CircuitBreaker from "opossum";
import { defaultBreakerOptions } from "./breaker.options";

@Injectable()
export class CircuitBreakerService{
    private readonly logger = new Logger(CircuitBreakerService.name);
    private readonly breakers = new Map<string, CircuitBreaker<any,any>>();

    getBreaker<TArgs, TResult>(
    serviceName: string,
    action: (...args: TArgs[]) => Promise<TResult>,
  ): CircuitBreaker<any, any> {
    // Se já existe, reaproveita (importante: manter estado)
    const existing = this.breakers.get(serviceName);
    if (existing) return existing;

    // Cria um breaker novo para o serviço
    const breaker = new CircuitBreaker(action, defaultBreakerOptions);

    // Eventos são ótimos para aprender e observar comportamento
    breaker.on('open', () => this.logger.warn(`Circuit OPEN para ${serviceName}`));
    breaker.on('halfOpen', () => this.logger.warn(`Circuit HALF_OPEN para ${serviceName}`));
    breaker.on('close', () => this.logger.log(`Circuit CLOSED para ${serviceName}`));
    breaker.on('reject', () => this.logger.warn(`Request REJEITADA (OPEN) para ${serviceName}`));
    breaker.on('timeout', () => this.logger.warn(`Timeout ao chamar ${serviceName}`));
    breaker.on('failure', (err) => this.logger.warn(`Failure em ${serviceName}: ${err?.message ?? err}`));
    breaker.on('success', () => this.logger.debug(`Success em ${serviceName}`));

    this.breakers.set(serviceName, breaker);
    return breaker;
  }
}