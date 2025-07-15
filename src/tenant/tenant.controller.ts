import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantDto } from './tenant.dto';

@Controller('tenant')
export class TenantController {
    constructor(
        private readonly tenantService:TenantService
    ){}
    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async createTenant (@Body() dto:TenantDto){
        return await this.tenantService.createTenant(dto);
    }

    /**
     * Get tenant details by subdomain (domain)
     * Example: GET /tenant/acme
     */
    @Get(':domain')
    async getTenantByDomain(@Param('domain') domain: string) {
        const tenant = await this.tenantService.getTenantByDomain(domain);
        if (!tenant) {
            throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
        }
        return tenant;
    }
}
