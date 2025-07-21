import { DataSourceOptions } from 'typeorm';

import { join } from 'path';
import ormConfig from './orm.config';
import { School } from './tenancy/school/school.entity';
import { User } from './tenancy/user/entity/User.entity';

// Log the current directory and migration path for debugging
const migrationPath = join(process.cwd(), 'dist/migrations/tenanted/*{.js}');
console.log('Current directory (tenant.orm.config):', __dirname);
console.log('Process cwd:', process.cwd());
console.log('Migration path:', migrationPath);

const tenantConfig: DataSourceOptions = {
  ...ormConfig,
  synchronize: true, // Enable synchronize for tenant schemas to auto-create tables
  entities: [User, School],
  migrations: [migrationPath],
};

export default tenantConfig;