import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, InternalServerErrorException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productService:ProductsService){}

    @Post()
    async create(@Body() data:CreateProductDto){
        try {
            return await this.productService.create(data);
        } catch (error) {
            throw new InternalServerErrorException('Failed to create product');
        }
    }


    @Get()
    async findAll(){
        return await this.productService.findAll();
    }

    @Get(':id')
     async findOne(@Param('id') id:string){
        try { 
            const product = await this.productService.findOne(id);
            if(!product){
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new BadRequestException('Failed to find product');
        }
    }

    @Patch(':id')
    async update(@Param('id') id:string, @Body() data:UpdateProductDto){
        try {
            const product = await this.productService.update(id, data);
            if(!product){
                throw new BadRequestException('Product not found');
            }
            return product;
        } catch (error) {
            throw new InternalServerErrorException('Failed to update product');
        }
    }

    @Delete(':id')
    async delete(@Param('id') id:string){
        try {
            const product = await this.productService.delete(id);
            if(!product){
                throw new BadRequestException('Product not found');
            }
            return product;
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete product');
        }
    }
}
