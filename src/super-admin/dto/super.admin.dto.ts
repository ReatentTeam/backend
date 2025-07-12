import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      "Password too weak. It must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  })
  password: string;

  @IsString()
  @IsOptional()
  role: string;
}


export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

 
  @IsString()
  @IsOptional()
  role?: number;

  // @IsString()
  // @IsOptional()
  // profile_picture?: string;
}