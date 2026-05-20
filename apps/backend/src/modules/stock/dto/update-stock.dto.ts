import { IsOptional, IsInt, Min, IsString } from "class-validator";

export class UpdateStockDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  location?: string;
}
