import { IsOptional, IsBoolean, IsIn } from "class-validator";

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: string;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}
