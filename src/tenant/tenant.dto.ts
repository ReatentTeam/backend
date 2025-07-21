import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from "class-validator";

export class TenantDto {
    // Tenant Information
    @IsNotEmpty()
    domain: string;
    
    @IsNotEmpty()
    name: string;
    
    // Admin User Information
    @IsNotEmpty()
    firstname: string;
    
    @IsNotEmpty()
    lastname: string;
    
    @IsNotEmpty()
    @IsEmail()
    email: string;

    // School Information (Optional for basic tenant creation)
    @IsOptional()
    @IsString()
    schoolName?: string;

    @IsOptional()
    @IsString()
    schoolAddress?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    schoolType?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    totalStudents?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    totalTutors?: number;
}