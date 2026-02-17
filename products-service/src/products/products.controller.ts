import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productService:ProductsService){}

    @Post()
    create(@Body() data:CreateProductDto){
        return this.productService.create(data);
    }


    @Get()
    findAll(){
        return this.productService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id:string){
        return this.productService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id:string, @Body() data:UpdateProductDto){
        return this.productService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id:string){
        return this.productService.delete(id);
    }
}
