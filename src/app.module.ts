import { Module } from '@nestjs/common';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantModule } from './tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormConfig from './orm.config';
import { ConfigModule } from '@nestjs/config';
import configuration from "./config/env.config"
import * as dotenv from "dotenv";
dotenv.config()

@Module({
  imports: [ConfigModule.forRoot({
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      cache: true,
    }),SuperAdminModule, TenantModule, TypeOrmModule.forRoot(ormConfig)],
  controllers: [],
  providers: [],
})
export class AppModule {}
