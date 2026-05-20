import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { AlertType } from "@prisma/client";

export class GetAlertsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @IsOptional()
  unread?: boolean;
}
