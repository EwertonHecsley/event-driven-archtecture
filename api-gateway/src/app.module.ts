import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import serviceConfig from './config/service.config';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serviceConfig],
    }),
    ProxyModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
