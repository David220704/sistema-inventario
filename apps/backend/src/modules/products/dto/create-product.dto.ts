import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsUrl,
} from "class-validator";

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsString()
  category_id!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_quantity?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number = 0;

  @IsOptional()
  @IsString()
  image_url?: string;
}
