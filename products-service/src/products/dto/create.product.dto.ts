import { IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;
}
