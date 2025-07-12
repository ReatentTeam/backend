import {  Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { Repository } from 'typeorm';
import { TenantDto } from './tenant.dto';
import { getTenantConnection } from './tenant.config';

@Injectable()
export class TenantService {
    constructor(
      
        @InjectRepository(Tenant)
        private readonly tenantRepository:Repository<Tenant>
    ){}

    async createTenant( dto:TenantDto){
        console.log(dto)
        let  newTenant = this.tenantRepository.create(dto);
        newTenant =  await this.tenantRepository.save(newTenant);

        const newSchema = `tenant_${newTenant.domain}`
        await this.tenantRepository.manager.query(
            `CREATE SCHEMA IF NOT EXISTS "${newSchema}";`
        );

        const connection =  await getTenantConnection(newTenant.domain);
        await connection.runMigrations();
        await connection.destroy();
        return newTenant;

    }

    async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
        return this.tenantRepository.findOne({ where: { domain } });
    }

    async getAllTenants(): Promise<Tenant[]> {
        return this.tenantRepository.find();
    }
    async deleteTenant(domain: string): Promise<void> {
        const tenant = await this.getTenantByDomain(domain);
        if (tenant) {
            await this.tenantRepository.remove(tenant);
            const schemaName = `tenant_${domain}`;
            await this.tenantRepository.manager.query(
                `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`
            );
        }
    }
}
