import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetSalesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;
}
