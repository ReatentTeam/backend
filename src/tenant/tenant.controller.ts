import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantDto } from './tenant.dto';

@Controller('tenant')
export class TenantController {
    constructor(
        private readonly tenantService: TenantService
    ){}

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async createTenant(@Body() dto: TenantDto) {
        return await this.tenantService.createTenant(dto);
    }
}
