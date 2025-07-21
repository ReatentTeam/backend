import { IsEmail, IsNotEmpty } from "class-validator";

export class UserDto {
    @IsNotEmpty()
    firstname: string;
    @IsNotEmpty()
    lastname: string;
    @IsEmail()
    email: string;
    @IsNotEmpty()
    password: string;
    @IsNotEmpty()
    domain: string; // Assuming tenantId is a number, adjust as necessary
}