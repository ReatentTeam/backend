import { Module, Scope } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Request as ExpressRequest } from 'express';
import { REQUEST } from '@nestjs/core';
import { getTenantConnection } from './tenant.config';
import { Tenant } from './tenant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolModule } from '../tenancy/school/school.module';
import { UserModule } from '../tenancy/user/user.module';
import { MailModule } from '../mail/mail.module';
import { School } from '../tenancy/school/school.entity';
import { User } from '../tenancy/user/entity/User.entity';
import { OtpService } from 'src/helpers/otp.service';

export const CONNECTION = Symbol('CONNECTION');

const connectionFactory = {
  provide: CONNECTION,
  scope: Scope.REQUEST,
  useFactory: async (request: ExpressRequest) => {
    const { tenantDomain } = request;

    if (tenantDomain) {
      return await getTenantConnection(tenantDomain);
    }

    return null;
  },
  inject: [REQUEST],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      School,
      User
    ]),
    SchoolModule,
    UserModule,
    MailModule,
  ],
  providers: [TenantService, connectionFactory, OtpService],
  exports: [CONNECTION, TenantService],
  controllers: [TenantController]
})
export class TenantModule {}
