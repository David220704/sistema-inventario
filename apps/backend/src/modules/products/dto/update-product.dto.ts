import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsUrl,
} from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  image_url?: string;
}
