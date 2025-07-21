import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { SuperAdminEntity } from './super-admin/super-admin.entity';
import * as dotenv from "dotenv";
import { Tenant } from './tenant/tenant.entity';
import { User } from './tenancy/user/entity/User.entity';
import { School } from './tenancy/school/school.entity';
dotenv.config()

const ormConfig:DataSourceOptions  = {
  name: 'default',
  type: 'postgres',
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_DATABASE ,
  synchronize: true,
  // autoLoadEntities: true,
  // logging: true,
//   namingStrategy: new SnakeNamingStrategy(),
  entities: [SuperAdminEntity, Tenant],
  migrations: [join(__dirname, './migrations/public/*{.ts,.js}')],
};

export default ormConfig;

