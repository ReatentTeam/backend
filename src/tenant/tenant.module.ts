import { Module, Scope } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Request as ExpressRequest } from 'express';
import { REQUEST } from '@nestjs/core';
import { getTenantConnection } from './tenant.config';
import { Tenant } from './tenant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

export const CONNECTION = Symbol('CONNECTION');

const connectionFactory = {
  provide: CONNECTION,
  scope: Scope.REQUEST,
  useFactory: (request: ExpressRequest) => {
    const { tenantDomain } = request;

    if (tenantDomain) {
      return getTenantConnection(tenantDomain);
    }

    return null;
  },
  inject: [REQUEST],
};

@Module({
  imports:[
    TypeOrmModule.forFeature([
          Tenant
        ])
  ],
  providers: [TenantService, connectionFactory],
  exports:[CONNECTION],
  controllers: [TenantController]
})
export class TenantModule {}
