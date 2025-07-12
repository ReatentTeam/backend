import { Body, Controller, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantDto } from './tenant.dto';

@Controller('tenant')
export class TenantController {
    constructor(
        private readonly tenantService:TenantService
    ){}
    @Post()
    async createTenant (@Body() dto:TenantDto){
        return await this.tenantService.createTenant(dto);
    }
}
