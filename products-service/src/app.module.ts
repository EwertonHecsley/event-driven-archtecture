import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './infra/prisma/prisma.module';

@Module({
  imports: [ProductsModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
