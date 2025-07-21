import { Module } from '@nestjs/common';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantModule } from './tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormConfig from './orm.config';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './tenancy/user/user.module';
import { MailModule } from './mail/mail.module';
import { SchoolModule } from './tenancy/school/school.module';
import configuration from "./config/env.config"
import * as dotenv from "dotenv";
dotenv.config()

@Module({
  imports: [ConfigModule.forRoot({
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      cache: true,
    }),SuperAdminModule, TenantModule, TypeOrmModule.forRoot(ormConfig), UserModule, MailModule, SchoolModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
