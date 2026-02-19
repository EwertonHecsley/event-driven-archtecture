import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { CircuitBreakerModule } from 'src/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [CircuitBreakerModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
