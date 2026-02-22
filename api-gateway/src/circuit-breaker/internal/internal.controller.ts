import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { CircuitBreakerService } from '../circuit-breaker.service';
import { ConfigService } from '@nestjs/config';

@Controller('internal')
export class InternalController {
  constructor(
    private readonly breakerService: CircuitBreakerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Endpoint interno para observabilidade do gateway.
   *
   * Proteção simples:
   * - Em produção: exige header x-internal-key = INTERNAL_API_KEY
   * - Em dev: pode liberar sem chave (opcional)
   */
  @Get('circuit-breakers')
  getCircuitBreakers(@Req() req: Request) {
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    const internalApiKey = this.configService.get<string>('internalApiKey');

    if (isProd) {
      const key = req.header('x-internal-key');

      if (!internalApiKey || key !== internalApiKey) {
        throw new UnauthorizedException('Invalid internal key');
      }
    }

    return this.breakerService.getAllSnapshots();
  }
}