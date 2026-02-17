import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma:PrismaService){}

    async findAll(){
        return await this.prisma.product.findMany();
    }

    async findOne(id:string){
        return await this.prisma.product.findUnique({
            where:{id}
        });
    }

    async create(data:CreateProductDto){
        return await this.prisma.product.create({
            data
        });
    }

    async update(id:string, data:UpdateProductDto){
        return await this.prisma.product.update({
            where:{id},
            data
        });
    }

    async delete(id:string){
        return await this.prisma.product.delete({
            where:{id}
        });
    }
}
