import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from "class-validator";

export class CreateStockDto {
  // Product ID now uses string UUIDs/identifiers, not numeric
  @IsString()
  @IsNotEmpty()
  product_id!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location!: string;
}
