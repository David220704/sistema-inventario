import { IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  oldPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;

  // Optional confirmation field for safety
  @IsOptional()
  @IsString()
  confirmNewPassword?: string;
}
