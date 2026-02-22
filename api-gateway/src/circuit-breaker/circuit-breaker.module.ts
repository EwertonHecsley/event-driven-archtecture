import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { InternalController } from './internal/internal.controller';

@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
  controllers: [InternalController],
})
export class CircuitBreakerModule {}
