import { IsNotEmpty } from "class-validator";

export class TenantDto {
    @IsNotEmpty()
    domain: string;
    @IsNotEmpty()
    name: string;
}