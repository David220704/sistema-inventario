import { IsOptional } from "class-validator";

export class ExportDataDto {
  @IsOptional()
  format?: string; // e.g. json, csv
}
