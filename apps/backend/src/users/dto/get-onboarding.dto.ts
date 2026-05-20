import { IsOptional, IsString, IsUUID } from "class-validator";

export class GetOnboardingDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;
}
